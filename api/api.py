import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)


filter_commands = {
    "COLOR_RGB2RGB": "COLOR_RGB2RGB",
    "COLOR_RGB2GRAY": "COLOR_RGB2GRAY",
    "COLOR_RGB2HSV": "COLOR_RGB2HSV",
    "COLOR_RGB2YUV": "COLOR_RGB2YUV",
    "COLOR_RGB2LAB": "COLOR_RGB2LAB",
    "BLUR": "BLUR",
    "CANNY": "CANNY",
    "SOBEL": "SOBEL",
    "LAPLACIAN": "LAPLACIAN",
    "PREWITT": "PREWITT",
    "ROBERTS": "ROBERTS",
    "OTSU": "OTSU",
    "ADAPTIVE_THRESHOLD": "ADAPTIVE_THRESHOLD",
    "THRESHOLD": "THRESHOLD",
    "EROSION": "EROSION",
    "MORPH_DILATE": "MORPH_DILATE",
    "OPENING": "OPENING",
    "CLOSING": "CLOSING",
}

ddepth_mapping = {
        'cv2.CV_8U': cv2.CV_8U,
        'cv2.CV_16U': cv2.CV_16U,
        'cv2.CV_16S': cv2.CV_16S,
        'cv2.CV_32F': cv2.CV_32F,
        'cv2.CV_64F': cv2.CV_64F
    }
AdaptiveType_mapping = {
        'cv2.ADAPTIVE_THRESH_MEAN_C': cv2.ADAPTIVE_THRESH_MEAN_C,
        'cv2.ADAPTIVE_THRESH_GAUSSIAN_C': cv2.ADAPTIVE_THRESH_GAUSSIAN_C
    }

def apply_filters(image, filters):
    processed_image = image.copy()  
    for filter_data in filters:
        command = filter_data['command']
        additional_parameters = filter_data.get('additionalParameters', {})          
        if command == "COLOR_RGB2RGB":
            processed_image = processed_image          
        elif command == "COLOR_RGB2GRAY":
            
            if len(processed_image.shape) == 3 and processed_image.shape[2] == 3:
                processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
            else:
                print("A imagem não tem três canais (RGB), não é possível converter para escala de cinza.")
        
        elif command == "COLOR_RGB2HSV":
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2HSV)
        
        elif command == "COLOR_RGB2YUV":
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2YUV)
        
        elif command == "COLOR_RGB2LAB":
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2LAB)
        
        elif command == "BLUR":
            kernel_size = additional_parameters.get('Kernel', 1)
            processed_image = cv2.blur(processed_image, (kernel_size, kernel_size))
        
        elif command == "CANNY":
            threshold1 = additional_parameters.get('Threshold 1', 0)
            threshold2 = additional_parameters.get('Threshold 2', 0)
            processed_image = cv2.Canny(processed_image, threshold1, threshold2)
        
        elif command == "SOBEL":
            ddepth = ddepth_mapping.get(additional_parameters.get('ddepth', 'cv2.CV_8U'), cv2.CV_8U)
            dx = cv2.Sobel(processed_image, ddepth, 1, 0)
            dy = cv2.Sobel(processed_image, ddepth, 0, 1)
            processed_image = cv2.addWeighted(dx, 0.5, dy, 0.5, 0)
        
        elif command == "LAPLACIAN":
            ddepth = ddepth_mapping.get(additional_parameters.get('ddepth', 'cv2.CV_8U'), cv2.CV_8U)
            processed_image_gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)  
            processed_image = cv2.Laplacian(processed_image_gray, ddepth)
        
        elif command == "PREWITT":
            x = additional_parameters.get('x', 0)
            y = additional_parameters.get('y', 0)
            processed_image = prewitt_filter(processed_image, x/100 , y/100)
        
        elif command == "ROBERTS":
            x = additional_parameters.get('x', 0)
            y = additional_parameters.get('y', 0)
            processed_image = roberts_filter(processed_image,x/100,y/100)
        
        elif command == "OTSU":
            max = additional_parameters.get('Max', 255)
            min = additional_parameters.get('Min', 0)
            processed_image = otsu_threshold(processed_image,min,max)
        
        elif command == "ADAPTIVE_THRESHOLD":
            AdaptiveType = AdaptiveType_mapping.get(additional_parameters.get('AdaptiveType', 'cv2.CV_8U'), cv2.ADAPTIVE_THRESH_MEAN_C)
            max = additional_parameters.get('Max', 255)
            processed_image = adaptive_threshold(processed_image,max,AdaptiveType)
        
        elif command == "THRESHOLD":
            processed_image = simple_threshold(processed_image)
        
        elif command == "EROSION":
            px = additional_parameters.get('px', 0)
            processed_image = erosion(processed_image,px)
        
        elif command == "MORPH_DILATE":
            px = additional_parameters.get('px', 0)
            processed_image = morphological_dilate(processed_image,px)
        
        elif command == "OPENING":
            px = additional_parameters.get('px', 0)
            processed_image = opening(processed_image,px)
        
        elif command == "CLOSING":
            px = additional_parameters.get('px', 0)
            processed_image = closing(processed_image,px)
        
        else:
            print(f"Filtro não reconhecido: {command}")
        
    return processed_image


def prewitt_filter(image, x , y):
    kernel_x = np.array([[-1, 0, 1],
                         [-1, 0, 1],
                         [-1, 0, 1]])
    
    kernel_y = np.array([[-1, -1, -1],
                         [0, 0, 0],
                         [1, 1, 1]])

    prewitt_x = cv2.filter2D(image, -1, kernel_x)
    prewitt_y = cv2.filter2D(image, -1, kernel_y)

   
    prewitt = cv2.addWeighted(cv2.convertScaleAbs(prewitt_x), x, cv2.convertScaleAbs(prewitt_y), y, 0)
    
    return prewitt

def roberts_filter(image,x,y):
    kernel_x = np.array([[1, 0],
                         [0, -1]])
    
    kernel_y = np.array([[0, 1],
                         [-1, 0]])

    roberts_x = cv2.filter2D(image, -1, kernel_x)
    roberts_y = cv2.filter2D(image, -1, kernel_y)

    roberts = cv2.addWeighted(cv2.convertScaleAbs(roberts_x), x, cv2.convertScaleAbs(roberts_y), y, 0)
    
    return roberts

def otsu_threshold(image, min_value=0, max_value=255):
    if len(image.shape) == 3 and image.shape[2] == 3:
        processed_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        processed_image = image
    _, thresholded = cv2.threshold(processed_image, min_value, max_value, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresholded

def adaptive_threshold(image, max_value,adaptive_method):
    if len(image.shape) == 3 and image.shape[2] == 3:
        processed_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        processed_image = image
    block_size = 11  
    C = -2          
    
    threshold_type = cv2.THRESH_BINARY          

    thresholded = cv2.adaptiveThreshold(processed_image, max_value, adaptive_method, threshold_type, block_size, C)
    return thresholded


def simple_threshold(image, threshold_value=128, max_value=255, threshold_type=cv2.THRESH_BINARY):
    if len(image.shape) == 3 and image.shape[2] == 3:
        processed_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        processed_image = image
    _, thresholded = cv2.threshold(processed_image, threshold_value, max_value, threshold_type)
    return thresholded

def otsu_binary(image):
    if len(image.shape) == 3 and image.shape[2] == 3:
        processed_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        processed_image = image
    _, thresholded = cv2.threshold(processed_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return cv2.cvtColor(thresholded, cv2.COLOR_GRAY2BGR)

def erosion(image , px, kernel=None, iterations=1):
    if kernel is None:
        kernel = np.ones((px, px), np.uint8)
    return cv2.erode(image, kernel, iterations=iterations)

def morphological_dilate(image,px, kernel=None, iterations=1):
    if kernel is None:
        kernel = np.ones((px, px), np.uint8)
    return cv2.dilate(image, kernel, iterations=iterations)

def opening(image,px ,kernel=None, iterations=1):
    if kernel is None:
        kernel = np.ones((px, px), np.uint8)
    return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel, iterations=iterations)

def closing(image,px, kernel=None, iterations=1):
    if kernel is None:
        kernel = np.ones((px, px), np.uint8)
    return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel, iterations=iterations)

@app.route('/process_image', methods=['POST'])
@cross_origin()
def process_image():

    if 'image' not in request.json or 'filters' not in request.json:
        return jsonify({'error': 'Missing image or filters data'})

 
    base64_image = request.json['image']
    filters = request.json['filters']

    
    image_data = base64.b64decode(base64_image)
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    
    processed_image = apply_filters(image, filters)

    
    if processed_image is None:
        return jsonify({'error': 'Failed to process image'})

    
    _, img_encoded = cv2.imencode('.jpg', processed_image)
    processed_image_base64 = base64.b64encode(img_encoded).decode('utf-8')
    
    
    return jsonify({'message': 'Image processed successfully', 'processed_image': processed_image_base64})

if __name__ == '__main__':
    app.run(debug=True)
