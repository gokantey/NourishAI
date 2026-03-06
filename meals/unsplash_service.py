import requests
import os

from concurrent.futures import ThreadPoolExecutor

UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY')

def fetch_meal_image(meal_title):
    if not UNSPLASH_ACCESS_KEY:
        return None
    try:
        # Map common Ghanaian dishes to better search terms
        food_map = {
            'waakye': 'rice and beans african food',
            'banku': 'fermented corn dough african food',
            'fufu': 'fufu soup african food',
            'kenkey': 'kenkey fried fish ghana',
            'jollof': 'jollof rice west african',
            'kelewele': 'fried plantain spicy',
            'red red': 'bean stew fried plantain',
            'kontomire': 'leafy green stew african',
            'omo tuo': 'rice balls soup african',
            'tuo zaafi': 'tuo zaafi soup northern ghana',
            'groundnut soup': 'peanut soup african food',
            'light soup': 'african light soup chicken',
            'palm nut soup': 'palm nut soup african',
            'garden egg stew': 'eggplant stew african',
            'chichinga': 'african kebab skewer grilled meat',
            'abenkwan': 'palm soup african food',
            'hausa koko': 'millet porridge african breakfast',
            'koose': 'black eyed pea fritters african',
            'bofrot': 'african donuts fried dough',
            'tom brown': 'roasted corn porridge',
        }

        # Find matching key in meal title
        search_term = None
        meal_lower = meal_title.lower()
        for dish, term in food_map.items():
            if dish in meal_lower:
                search_term = term
                break

        query = search_term if search_term else f"{meal_title} food dish plate"

        response = requests.get(
            'https://api.unsplash.com/search/photos',
            params={
                'query': query,
                'per_page': 3,
                'orientation': 'landscape',
                'content_filter': 'high',
            },
            headers={
                'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
            },
            timeout=5
        )
        data = response.json()
        if data.get('results'):
            for result in data['results']:
                tags = [t['title'].lower() for t in result.get('tags', [])]
                if any(t in tags for t in ['food', 'meal', 'dish', 'cuisine', 'cooking']):
                    return result['urls']['regular']
            return data['results'][0]['urls']['regular']
    except Exception:
        pass
    return None

def fetch_images_for_meals(meal_titles):
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fetch_meal_image, meal_titles))
    return results