from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os

def generate_pdf():
    input_file = 'USER_MANUAL.md'
    output_file = 'USER_MANUAL.pdf'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        return

    doc = SimpleDocTemplate(output_file, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Title'],
        fontSize=24,
        textColor='#009688',
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'H1Style',
        parent=styles['Heading1'],
        fontSize=18,
        textColor='#00796B',
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=5,
        borderWidth=0,
        borderStyle=None
    )

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple cleanup for the PDF
    content = content.replace('🏥', '').replace('🌟', '').replace('🛍️', '').replace('🔍', '').replace('🛒', '')
    content = content.replace('🔒', '').replace('⚡', '').replace('🚚', '').replace('📊', '').replace('🏗️', '')
    content = content.replace('📦', '').replace('🔐', '').replace('📝', '').replace('💊', '').replace('✅', 'OK')

    lines = content.split('\n')
    
    # Add Header
    story.append(Paragraph("<b>OMNICARE PHARMACY</b>", title_style))
    story.append(Paragraph("Official System Documentation & Feature Guide", ParagraphStyle('Sub', parent=styles['Normal'], alignment=TA_CENTER)))
    story.append(Spacer(1, 25))

    for line in lines:
        line = line.strip()
        if not line:
            story.append(Spacer(1, 6))
            continue
        
        if line.startswith('# '):
            story.append(Paragraph(f"<b>{line[2:]}</b>", h1_style))
        elif line.startswith('## '):
            story.append(Paragraph(f"<b>{line[3:]}</b>", styles['Heading2']))
        elif line.startswith('### '):
            story.append(Paragraph(f"<b>{line[4:]}</b>", styles['Heading3']))
        elif line.startswith('- '):
            story.append(Paragraph(f"&bull; {line[2:]}", styles['Normal']))
        elif line.startswith('> '):
            story.append(Paragraph(f"<i>{line[2:]}</i>", styles['Italic']))
        else:
            story.append(Paragraph(line, styles['Normal']))

    doc.build(story)
    print(f"✅ Success! Manual generated: {output_file}")

if __name__ == "__main__":
    generate_pdf()
