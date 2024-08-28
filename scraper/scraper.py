import requests
import json
import time
from pathlib import Path
from datetime import datetime

# --- FLAGS ---
TESTFLAG = False
# -------------

def get_categories(isPreviousData, testing=False):
    url = "https://tienda.mercadona.es/api/categories/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if isPreviousData:
            data_file = 'data.json' if not testing else 'test.json'
            data_path = Path(data_file)
            
            with open(data_path, 'r', encoding='utf-8') as f:
                prev_data = json.load(f)
                if prev_data:
                    return prev_data['categories']
                
        else:
            formatted_categories = {}
            for category in data['results']:
                formatted_categories[category['id']] = {
                "id": category['id'],
                "name": category['name'],
                "subcategories": [
                    {
                        "id": sub['id'],
                        "name": sub['name']
                    } for sub in category.get('categories', [])
                ]
            }
        
        return formatted_categories
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving categories: {e}")
        return None

def get_products(categories, isPreviousData, testing=False):
    all_products = {}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for i, category in enumerate(categories.values()):

        if testing and i >= 2:
            break  # Stop after processing two categories if in testing mode
        
        for subcategory in category['subcategories']:

            subcategory_id = subcategory['id']
            url = f"https://tienda.mercadona.es/api/categories/{subcategory_id}"
            try:
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                products = data.get('categories', [{}])[0].get('products', [])
                
                # Save all information from the product object
                for product in products:
                    all_products[product['id']] = {
                        'id': product['id'],
                        'slug': product['slug'],
                        'limit': product['limit'],
                        'badges': product['badges'],
                        'status': product['status'],
                        'packaging': product['packaging'],
                        'published': product['published'],
                        'image_url': product['thumbnail'],
                        'categories': product['categories'],
                        'name': product['display_name'],
                        'unavailable_from': product['unavailable_from'],
                        'price_instructions': product['price_instructions'],
                        'unavailable_weekdays': product['unavailable_weekdays'],
                        'category_name': product['categories'][0]['name'] if product['categories'] else 'Uncategorized'
                    }
               
                print(f"Retrieved {len(products)} products from subcategory {subcategory['name']}")
            except requests.exceptions.RequestException as e:
                print(f"Error retrieving products for subcategory {subcategory['name']}: {e}")
            
            time.sleep(5)  # Pause to avoid overwhelming the server
    
    return all_products


def update_data(testing=False):
    max_retries = 3
    retry_delay = 60  # seconds

    # Attempt to get categories

    data_file = 'data.json' if not testing else 'test.json'
    data_path = Path(data_file)
    isPreviousData = data_path.exists()

    categories = None
    for attempt in range(max_retries):
        categories = get_categories(isPreviousData, testing)
        if categories:
            print("Categories fetched successfully.")
            break
        else:
            if attempt < max_retries - 1:
                print(f"Retrying category fetch in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached for category fetch. Exiting.")
                return

    # Attempt to get products
    products = None
    if categories:
        for attempt in range(max_retries):
            try:
                products = get_products(categories, isPreviousData, testing)
                print("Products fetched successfully.")
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Error fetching products: {e}")
                    print(f"Retrying product fetch in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    print("Max retries reached for product fetch. Exiting.")
                    return
    else:
        print("Cannot fetch products without categories. Exiting.")
        return

    # Update pricing data
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    if isPreviousData:
        with open(data_path, 'r', encoding='utf-8') as f:
            prev_data = json.load(f)
            pricing_data = prev_data.get('pricing', {})
    else:
        pricing_data = {}

    for product_id, product_info in products.items():
        category_name = product_info['category_name']
        if category_name not in pricing_data:
            pricing_data[category_name] = {}
        
        if product_id not in pricing_data[category_name]:
            pricing_data[category_name][product_id] = {
                "name": product_info['name'],
                "image_url": product_info['image_url'],
                "prices": {}
            }
        
        # Take data
        pricing_data[category_name][product_id]["prices"][current_date] = {}
        pricing_data[category_name][product_id]["prices"][current_date]['bulk_price'] = product_info['price_instructions']['bulk_price']
        pricing_data[category_name][product_id]["prices"][current_date]['price'] = product_info['price_instructions']['unit_price']

    # Combine all data
    combined_data = {
        "categories": categories,
        "products": products,
        "pricing": pricing_data
    }

    # Save combined data to data.json or test.json based on testing flag
    filename = 'test.json' if testing else 'data.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, ensure_ascii=False, indent=4)

    print(f"Data updated and saved to {filename}")

if __name__ == "__main__":
    update_data(testing=TESTFLAG)  # Set to True for testing, False for full run