import os
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
from typing import List
import zipfile

# Load environment variables from .env file (either in backend or parent directory)
load_dotenv()
load_dotenv("../.env")

# Initialize FastAPI app
app = FastAPI(title="Manga Translation API")

# Setup CORS to allow requests from the React frontend (running on Vite's default port or any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Text translation request model
class TextTranslateRequest(BaseModel):
    text: str
    target_language: str

# Helper to get Google GenAI client
def get_genai_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable not set on server.")
    return genai.Client(api_key=api_key)

@app.post("/api/translate/text")
async def translate_text(request: TextTranslateRequest):
    try:
        client = get_genai_client()
        
        prompt = f"""You are an expert manga and novel translator. Translate the following text into {request.target_language}. Maintain the original tone, formatting, and nuances if possible. Output the result in Markdown format.

Text to translate:
{request.text}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"translatedText": response.text or "No translation generated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_image_content(contents: bytes, target_language: str, client) -> bytes:
    # 1. Read image with OpenCV for processing
    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None:
        raise ValueError("Invalid image file.")
        
    import json
    
    prompt = f"""You are an expert manga translator. Find ONLY the text inside conversation/speech bubbles and translate it to {target_language}.
Ignore background text, sound effects, or margin notes.
Return a STRICT JSON array of objects. Do not include markdown formatting or comments. Each object must have exactly:
- "box_2d": [ymin, xmin, ymax, xmax] (bounding box coordinates normalized to 0-1000)
- "text_translation": "the translated text"
"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(
                data=contents,
                mime_type="image/jpeg"
            ),
            prompt
        ]
    )
    
    text_data = response.text
    if "```json" in text_data:
        text_data = text_data.split("```json")[1].split("```")[0]
    elif "```" in text_data:
        text_data = text_data.split("```")[1].split("```")[0]
        
    data = json.loads(text_data)
    
    height, width, _ = img_cv.shape
    mask = np.zeros((height, width), dtype=np.uint8)
    
    boxes = []
    for item in data:
        box = item.get("box_2d")
        text = item.get("text_translation")
        if box and len(box) == 4 and text:
            # Un-normalize coordinates
            ymin, xmin, ymax, xmax = box
            ymin = int(ymin * height / 1000)
            ymax = int(ymax * height / 1000)
            xmin = int(xmin * width / 1000)
            xmax = int(xmax * width / 1000)
            
            # Expand box slightly to ensure we capture the full text
            padding = 10
            ymin = max(0, ymin - padding)
            ymax = min(height, ymax + padding)
            xmin = max(0, xmin - padding)
            xmax = min(width, xmax + padding)
            
            boxes.append((xmin, ymin, xmax, ymax, text))
            
            # Create a precise mask for the text only (assuming dark text on light bubble)
            roi = img_cv[ymin:ymax, xmin:xmax]
            if roi.size > 0:
                gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                # Apply adaptive threshold to find text strokes
                _, text_mask = cv2.threshold(gray_roi, 150, 255, cv2.THRESH_BINARY_INV)
                
                # Dilate the mask slightly to cover the text completely during inpainting
                kernel = np.ones((3,3), np.uint8)
                text_mask = cv2.dilate(text_mask, kernel, iterations=1)
                
                # Add to master mask
                mask[ymin:ymax, xmin:xmax] = cv2.bitwise_or(mask[ymin:ymax, xmin:xmax], text_mask)
            
    # 2. Inpaint the precise text strokes
    inpainted_img = cv2.inpaint(img_cv, mask, 5, cv2.INPAINT_TELEA)
    
    # 3. Draw new text onto the image
    pil_img = Image.fromarray(cv2.cvtColor(inpainted_img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)
    
    font_path = "C:/Windows/Fonts/msyh.ttc"  # Microsoft YaHei
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arial.ttf"
        
    for box_data in boxes:
        xmin, ymin, xmax, ymax, text = box_data
        box_w = xmax - xmin
        box_h = ymax - ymin
        if box_w <= 0 or box_h <= 0: continue
        
        fontsize = min(box_h, 30)
        try:
            font = ImageFont.truetype(font_path, fontsize)
            lines = []
            while fontsize > 8:
                chars_per_line = max(1, int(box_w / (fontsize * 0.9)))
                # simple wrap by string slicing
                lines = [text[i:i+chars_per_line] for i in range(0, len(text), chars_per_line)]
                
                total_h = len(lines) * (fontsize + 4)
                if total_h <= box_h:
                    break
                fontsize -= 2
                font = ImageFont.truetype(font_path, fontsize)
            
            y_offset = ymin + max(0, (box_h - len(lines) * (fontsize + 4)) // 2)
            for line in lines:
                try:
                    line_w = font.getbbox(line)[2] - font.getbbox(line)[0]
                except:
                    line_w = font.getlength(line)
                x_offset = xmin + max(0, (box_w - int(line_w)) // 2)
                draw.text((x_offset, y_offset), line, font=font, fill=(0, 0, 0))
                y_offset += fontsize + 4
        except Exception as fe:
            print(f"Font drawing error: {fe}")
            
    # 4. Encode image to return bytes
    buffered = io.BytesIO()
    pil_img.save(buffered, format="JPEG")
    return buffered.getvalue()


@app.post("/api/translate/image")
async def translate_image(image: UploadFile, target_language: str = Form(...)):
    try:
        contents = await image.read()
        client = get_genai_client()
        result_bytes = process_image_content(contents, target_language, client)
        
        # Encode image to Base64 for backwards compatibility on single translation
        img_str = base64.b64encode(result_bytes).decode("utf-8")
        
        return {"translatedImageBase64": img_str, "translatedText": "Image was processed and updated."}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate/images-zip")
async def translate_images_zip(images: List[UploadFile], target_language: str = Form(...)):
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
        
    try:
        client = get_genai_client()
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i, upload_file in enumerate(images):
                contents = await upload_file.read()
                try:
                    result_bytes = process_image_content(contents, target_language, client)
                    
                    filename = upload_file.filename if upload_file.filename else f"translated_{i}.jpg"
                    # We always save as JPEG inside process_image_content
                    if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                        filename = f"{filename}.jpg"
                    elif filename.lower().endswith(('.png', '.webp')):
                        # Rename extension since PIL saves as JPEG
                        filename = filename.rsplit('.', 1)[0] + '.jpg'
                        
                    zip_file.writestr(filename, result_bytes)
                except Exception as e:
                    print(f"Error processing {upload_file.filename}: {e}")
                    # You could optionally write an error log inside the zip
                    zip_file.writestr(f"error_{upload_file.filename}.txt", f"Failed to translate: {e}")
        
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=translated_images.zip"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
