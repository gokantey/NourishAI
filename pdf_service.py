"""
NourishAI PDF Export Service
Generates a branded meal plan PDF using reportlab.
"""

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.platypus import PageBreak
from reportlab.lib.colors import HexColor

# ── Brand colours ──────────────────────────────────────────────────────────
NIGHT     = HexColor('#0D1A14')
SURFACE   = HexColor('#162019')
SURFACE2  = HexColor('#1C2B22')
LIME      = HexColor('#C8F135')
LIME_DARK = HexColor('#7A9918')
AMBER     = HexColor('#F5A623')
TEXT      = HexColor('#F0F5F0')
TEXT_DIM  = HexColor('#8FA88F')
WHITE     = colors.white

DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
MEAL_EMOJI = {'breakfast': '☀', 'lunch': '◉', 'dinner': '◈'}


def _styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, parent=base['Normal'], **kw)

    return {
        'title':       s('title',       fontSize=26, textColor=TEXT,     fontName='Helvetica-Bold',  leading=30, spaceAfter=4),
        'subtitle':    s('subtitle',    fontSize=11, textColor=TEXT_DIM,  fontName='Helvetica',       leading=14, spaceAfter=2),
        'section':     s('section',     fontSize=14, textColor=LIME,      fontName='Helvetica-Bold',  leading=18, spaceBefore=14, spaceAfter=6),
        'day_head':    s('day_head',    fontSize=12, textColor=WHITE,      fontName='Helvetica-Bold',  leading=15),
        'meal_name':   s('meal_name',   fontSize=11, textColor=TEXT,      fontName='Helvetica-Bold',  leading=14, spaceBefore=4),
        'meal_desc':   s('meal_desc',   fontSize=9,  textColor=TEXT_DIM,  fontName='Helvetica',       leading=12),
        'label':       s('label',       fontSize=7,  textColor=AMBER,     fontName='Helvetica-Bold',  leading=9,  spaceBefore=6, spaceAfter=1),
        'body':        s('body',        fontSize=9,  textColor=TEXT_DIM,  fontName='Helvetica',       leading=13),
        'body_bold':   s('body_bold',   fontSize=9,  textColor=TEXT,      fontName='Helvetica-Bold',  leading=13),
        'shop_cat':    s('shop_cat',    fontSize=8,  textColor=LIME,      fontName='Helvetica-Bold',  leading=10, spaceBefore=8, spaceAfter=2),
        'shop_item':   s('shop_item',   fontSize=8,  textColor=TEXT_DIM,  fontName='Helvetica',       leading=11),
        'footer':      s('footer',      fontSize=7,  textColor=TEXT_DIM,  fontName='Helvetica',       alignment=TA_CENTER),
        'nut_val':     s('nut_val',     fontSize=13, textColor=LIME,      fontName='Helvetica-Bold',  leading=15, alignment=TA_CENTER),
        'nut_label':   s('nut_label',   fontSize=7,  textColor=TEXT_DIM,  fontName='Helvetica',       leading=9,  alignment=TA_CENTER),
        'centered':    s('centered',    fontSize=9,  textColor=TEXT_DIM,  fontName='Helvetica',       alignment=TA_CENTER),
    }


def _dark_table_style(extra=None):
    base = [
        ('BACKGROUND',  (0, 0), (-1, 0), SURFACE2),
        ('TEXTCOLOR',   (0, 0), (-1, 0), LIME),
        ('FONTNAME',    (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [SURFACE, SURFACE2]),
        ('TEXTCOLOR',   (0, 1), (-1, -1), TEXT_DIM),
        ('FONTNAME',    (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',    (0, 1), (-1, -1), 8),
        ('GRID',        (0, 0), (-1, -1), 0.3, HexColor('#2A3A2A')),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',  (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]
    if extra:
        base.extend(extra)
    return TableStyle(base)


def _on_page(canvas, doc):
    """Header and footer on every page."""
    w, h = A4
    canvas.saveState()

    # Dark background
    canvas.setFillColor(NIGHT)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

    # Kente top strip (repeating colored segments)
    kente_colors = [NIGHT, AMBER, NIGHT, HexColor('#D4341A'), NIGHT, HexColor('#2A7A3A'), NIGHT, AMBER]
    seg_w = w / (len(kente_colors) * 2)
    for i, col in enumerate(kente_colors * 2):
        canvas.setFillColor(col)
        canvas.rect(i * seg_w, h - 6*mm, seg_w, 6*mm, fill=1, stroke=0)

    # Footer
    canvas.setFillColor(TEXT_DIM)
    canvas.setFont('Helvetica', 7)
    canvas.drawCentredString(w / 2, 10*mm, f'NourishAI — Personalised Ghanaian Meal Planning  •  Page {doc.page}')
    canvas.setFillColor(SURFACE2)
    canvas.rect(0, 0, w, 8*mm, fill=1, stroke=0)

    canvas.restoreState()


def generate_meal_plan_pdf(meal_plan):
    """
    Generate a PDF for the given MealPlan instance.
    Returns a BytesIO buffer.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=22*mm, bottomMargin=20*mm,
        onFirstPage=_on_page, onLaterPages=_on_page,
    )

    S = _styles()
    story = []
    W = A4[0] - 36*mm  # usable width

    user = meal_plan.user_profile.user
    profile = meal_plan.user_profile

    # ── Cover section ─────────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    plan_title = meal_plan.title or f'Week of {meal_plan.week_start_date}'
    story.append(Paragraph(plan_title, S['title']))
    story.append(Paragraph(
        f'Prepared for {user.first_name} {user.last_name}  •  Generated by NourishAI',
        S['subtitle']
    ))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width=W, thickness=1, color=LIME_DARK))
    story.append(Spacer(1, 4*mm))

    # ── Profile snapshot ──────────────────────────────────────────────────
    story.append(Paragraph('YOUR PROFILE SNAPSHOT', S['label']))
    profile_data = [
        ['Calories', 'BMI', 'Water', 'Goal', 'Region'],
        [
            f"{profile.daily_calorie_target or '—'} kcal/day",
            f"{profile.bmi or '—'} ({profile.bmi_category or '—'})",
            f"{profile.daily_water_intake or '—'} L/day",
            (profile.fitness_goal or '—').replace('_', ' ').title(),
            (profile.region or '—').replace('_', ' ').title(),
        ]
    ]
    t = Table(profile_data, colWidths=[W/5]*5)
    t.setStyle(_dark_table_style())
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # ── Nutrition summary ─────────────────────────────────────────────────
    meals_qs = list(meal_plan.meals.all())
    totals = {
        'calories':      sum(m.calories for m in meals_qs),
        'protein':       round(sum(m.protein for m in meals_qs), 1),
        'carbohydrates': round(sum(m.carbohydrates for m in meals_qs), 1),
        'fats':          round(sum(m.fats for m in meals_qs), 1),
        'fibre':         round(sum(m.fibre for m in meals_qs), 1),
    }

    story.append(Paragraph('WEEKLY NUTRITION TOTALS', S['label']))
    nut_data = [
        [Paragraph(str(totals.get('calories', '—')), S['nut_val']),
         Paragraph(f"{totals.get('protein', '—')}g", S['nut_val']),
         Paragraph(f"{totals.get('carbohydrates', '—')}g", S['nut_val']),
         Paragraph(f"{totals.get('fats', '—')}g", S['nut_val']),
         Paragraph(f"{totals.get('fibre', '—')}g", S['nut_val'])],
        [Paragraph('CALORIES', S['nut_label']),
         Paragraph('PROTEIN', S['nut_label']),
         Paragraph('CARBS', S['nut_label']),
         Paragraph('FATS', S['nut_label']),
         Paragraph('FIBRE', S['nut_label'])],
    ]
    t = Table(nut_data, colWidths=[W/5]*5)
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, -1), SURFACE2),
        ('BOX',         (0, 0), (-1, -1), 0.5, HexColor('#2A3A2A')),
        ('INNERGRID',   (0, 0), (-1, -1), 0.3, HexColor('#2A3A2A')),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',  (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 8*mm))

    # ── 7-day schedule ────────────────────────────────────────────────────
    story.append(Paragraph('7-DAY MEAL SCHEDULE', S['section']))
    story.append(HRFlowable(width=W, thickness=0.5, color=SURFACE2))
    story.append(Spacer(1, 3*mm))

    meals_by_day = {}
    for meal in meal_plan.meals.all().order_by('day', 'meal_type'):
        meals_by_day.setdefault(meal.day, {})[meal.meal_type] = meal

    for day in DAYS:
        day_meals = meals_by_day.get(day, {})
        if not day_meals:
            continue

        # Day header row
        day_block = []
        day_header = Table(
            [[Paragraph(day.upper(), S['day_head'])]],
            colWidths=[W]
        )
        day_header.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), SURFACE2),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW',     (0,0), (-1,-1), 1.5, LIME_DARK),
        ]))
        day_block.append(day_header)
        day_block.append(Spacer(1, 3*mm))

        for mtype in MEAL_TYPES:
            meal = day_meals.get(mtype)
            if not meal:
                continue

            # Meal type pill + name
            meal_row = []
            meal_row.append(Paragraph(
                f'<b>{MEAL_EMOJI.get(mtype, "•")} {mtype.upper()}</b>',
                ParagraphStyle('pill', fontSize=7, textColor=AMBER, fontName='Helvetica-Bold', leading=9, spaceAfter=2)
            ))
            meal_row.append(Paragraph(meal.title, S['meal_name']))

            if meal.description:
                meal_row.append(Paragraph(meal.description, S['meal_desc']))

            # Nutrition chips
            nut_line = f'🔥 {meal.calories} kcal  ·  💪 {meal.protein}g protein  ·  🌾 {meal.carbohydrates}g carbs  ·  🫙 {meal.fats}g fats'
            meal_row.append(Paragraph(nut_line, S['meal_desc']))

            # Meta
            meta_parts = []
            if meal.prep_time:
                meta_parts.append(f'⏱ {meal.prep_time} min')
            if meal.difficulty:
                meta_parts.append(f'Chef: {meal.difficulty.title()}')
            if meal.suggested_time:
                meta_parts.append(f'🕐 {meal.suggested_time}')
            if meta_parts:
                meal_row.append(Paragraph('  ·  '.join(meta_parts), S['meal_desc']))

            # Ingredients
            if meal.ingredients:
                meal_row.append(Paragraph('INGREDIENTS', S['label']))
                if isinstance(meal.ingredients, list):
                    ing_lines = []
                    for ing in meal.ingredients:
                        if isinstance(ing, dict):
                            parts = [ing.get('quantity',''), ing.get('unit',''), ing.get('name', ing.get('ingredient_name',''))]
                            ing_lines.append(' '.join(p for p in parts if p).strip())
                        else:
                            ing_lines.append(str(ing))
                    ing_text = '  ·  '.join(ing_lines)
                else:
                    ing_text = str(meal.ingredients)
                meal_row.append(Paragraph(ing_text, S['body']))

            # Instructions
            if meal.instructions:
                meal_row.append(Paragraph('METHOD', S['label']))
                if isinstance(meal.instructions, list):
                    for i, step in enumerate(meal.instructions, 1):
                        meal_row.append(Paragraph(f'{i}.  {step}', S['body']))
                else:
                    for i, line in enumerate(str(meal.instructions).split('\n'), 1):
                        if line.strip():
                            meal_row.append(Paragraph(f'{i}.  {line.strip()}', S['body']))

            meal_row.append(Spacer(1, 4*mm))
            day_block.extend(meal_row)

        day_block.append(Spacer(1, 4*mm))
        story.append(KeepTogether(day_block[:6]))  # keep at least header + first meal together
        story.extend(day_block[6:])

    # ── Shopping list ─────────────────────────────────────────────────────
    try:
        shopping = meal_plan.shopping_list
        items = shopping.items.all()
        if items.exists():
            story.append(PageBreak())
            story.append(Paragraph('SHOPPING LIST', S['section']))
            story.append(HRFlowable(width=W, thickness=0.5, color=SURFACE2))
            story.append(Spacer(1, 4*mm))

            # Group by category
            grouped = {}
            for item in items:
                grouped.setdefault(item.category, []).append(item)

            for cat, cat_items in grouped.items():
                story.append(Paragraph(cat.upper(), S['shop_cat']))
                rows = [[
                    Paragraph(i.ingredient_name, S['shop_item']),
                    Paragraph(f'{i.quantity} {i.unit}'.strip(), S['shop_item']),
                ] for i in cat_items]
                t = Table(rows, colWidths=[W * 0.65, W * 0.35])
                t.setStyle(TableStyle([
                    ('ROWBACKGROUNDS', (0,0), (-1,-1), [SURFACE, SURFACE2]),
                    ('GRID',          (0,0), (-1,-1), 0.2, HexColor('#2A3A2A')),
                    ('TOPPADDING',    (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING',   (0,0), (-1,-1), 8),
                    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
                ]))
                story.append(t)
            story.append(Spacer(1, 6*mm))
    except Exception:
        pass

    # ── Footer note ───────────────────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=W, thickness=0.5, color=SURFACE2))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f'Generated by NourishAI for {user.first_name} {user.last_name}. '
        'This meal plan is personalised to your health profile and Ghanaian food culture. '
        'Consult a nutritionist before making significant dietary changes.',
        S['footer']
    ))

    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    buf.seek(0)
    return buf