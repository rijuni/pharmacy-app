import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.models import Product, Category

# Clear existing products (keep categories)
Product.objects.all().delete()

# Create categories
categories_data = {
    'Pain Relief': 'Over-the-counter and prescription pain medications',
    'Antibiotics': 'Antibacterial medications for infections',
    'Cold & Cough': 'Remedies for respiratory symptoms',
    'Digestive Health': 'Medications for stomach and digestive issues',
    'Heart Health': 'Cardiovascular and blood pressure medications',
    'Diabetes': 'Blood sugar management medications',
    'Vitamins & Supplements': 'Essential vitamins and nutritional supplements',
    'Skin Care': 'Topical treatments and dermatological products',
    'Anti-Allergy': 'Antihistamines and allergy relief medications',
    'Sleep & Nerves': 'Medications for sleep and anxiety management'
}

categories = {}
for cat_name, description in categories_data.items():
    cat, created = Category.objects.get_or_create(
        name=cat_name,
        defaults={'description': description}
    )
    categories[cat_name] = cat

# Medicine data: (name, generic_name, category, strength, form, manufacturer, price, availability, requires_rx, stock, description)
medicines = [
    # Pain Relief (8)
    ('Paracetamol', 'Acetaminophen', 'Pain Relief', '500mg', 'Tablet', 'Generic Pharma', 50, 'in_stock', False, 100, 'Common fever and pain reliever'),
    ('Ibuprofen', 'Ibuprofen', 'Pain Relief', '200mg', 'Tablet', 'Generic Pharma', 60, 'in_stock', False, 80, 'Anti-inflammatory pain relief'),
    ('Aspirin', 'Acetylsalicylic Acid', 'Pain Relief', '100mg', 'Tablet', 'Generic Pharma', 45, 'in_stock', False, 120, 'Heart health and pain relief'),
    ('Diclofenac', 'Diclofenac Sodium', 'Pain Relief', '50mg', 'Tablet', 'Cipla', 80, 'in_stock', True, 60, 'Potent anti-inflammatory'),
    ('Tramadol', 'Tramadol', 'Pain Relief', '50mg', 'Capsule', 'Cipla', 120, 'out_of_stock', True, 0, 'Opioid pain medication'),
    ('Naproxen', 'Naproxen Sodium', 'Pain Relief', '220mg', 'Tablet', 'Generic Pharma', 90, 'in_stock', False, 50, 'Long-acting pain reliever'),
    ('Acetaminophen Extra', 'Acetaminophen', 'Pain Relief', '650mg', 'Caplet', 'Leeford', 70, 'in_stock', False, 75, 'Extra strength pain relief'),
    ('Ketorolac', 'Ketorolac', 'Pain Relief', '10mg', 'Tablet', 'Cipla', 150, 'out_of_stock', True, 0, 'Injectable and oral pain relief'),

    # Antibiotics (8)
    ('Amoxicillin', 'Amoxicillin', 'Antibiotics', '500mg', 'Capsule', 'GSK', 85, 'in_stock', True, 70, 'Beta-lactam antibiotic'),
    ('Metronidazole', 'Metronidazole', 'Antibiotics', '400mg', 'Tablet', 'Cipla', 60, 'out_of_stock', True, 0, 'Treatment for parasitic and bacterial infections'),
    ('Azithromycin', 'Azithromycin', 'Antibiotics', '250mg', 'Tablet', 'Lupin', 110, 'in_stock', True, 40, 'Macrolide antibiotic'),
    ('Cephalexin', 'Cephalexin', 'Antibiotics', '500mg', 'Capsule', 'Cipla', 95, 'in_stock', True, 55, 'First-generation cephalosporin'),
    ('Fluoroquinolone', 'Levofloxacin', 'Antibiotics', '500mg', 'Tablet', 'Cipla', 130, 'in_stock', True, 35, 'Broad-spectrum antibiotic'),
    ('Penicillin V', 'Penicillin V', 'Antibiotics', '250mg', 'Tablet', 'Generic Pharma', 75, 'out_of_stock', True, 0, 'Oral penicillin antibiotic'),
    ('Doxycycline', 'Doxycycline', 'Antibiotics', '100mg', 'Capsule', 'Cipla', 105, 'in_stock', True, 50, 'Tetracycline antibiotic'),
    ('Trimethoprim-Sulfamethoxazole', 'TMP-SMX', 'Antibiotics', '800mg', 'Tablet', 'Cipla', 90, 'in_stock', True, 45, 'Combination antibiotic'),

    # Cold & Cough (7)
    ('Cough Syrup', 'Dextromethorphan', 'Cold & Cough', '10mg/ml', 'Syrup', 'Torrent', 85, 'in_stock', False, 60, 'Cough suppressant syrup'),
    ('Phenylephrine', 'Phenylephrine', 'Cold & Cough', '10mg', 'Tablet', 'Cipla', 55, 'in_stock', False, 85, 'Nasal decongestant'),
    ('Guaifenesin', 'Guaifenesin', 'Cold & Cough', '100mg', 'Syrup', 'Crocin', 70, 'in_stock', False, 70, 'Expectorant for mucus clearance'),
    ('Loratadine', 'Loratadine', 'Cold & Cough', '10mg', 'Tablet', 'Cipla', 95, 'in_stock', False, 50, 'Non-drowsy antihistamine'),
    ('Cetirizine', 'Cetirizine', 'Cold & Cough', '10mg', 'Tablet', 'Sun Pharma', 80, 'in_stock', False, 90, 'Allergy and cold relief'),
    ('Ambroxol', 'Ambroxol', 'Cold & Cough', '30mg', 'Tablet', 'Cipla', 65, 'in_stock', False, 100, 'Expectorant and mucolytic'),
    ('Sal-Ammoniac', 'Ammonium Chloride', 'Cold & Cough', '150mg', 'Lozenge', 'Generic Pharma', 40, 'out_of_stock', False, 0, 'Cough lozenge'),

    # Digestive Health (7)
    ('Omeprazole', 'Omeprazole', 'Digestive Health', '20mg', 'Capsule', 'Cipla', 110, 'in_stock', True, 55, 'Proton pump inhibitor for acid reflux'),
    ('Ranitidine', 'Ranitidine', 'Digestive Health', '150mg', 'Tablet', 'GSK', 85, 'in_stock', False, 70, 'H2 receptor antagonist'),
    ('Metoclopramide', 'Metoclopramide', 'Digestive Health', '10mg', 'Tablet', 'Cipla', 60, 'in_stock', True, 65, 'Anti-nausea and digestive aid'),
    ('Mebendazole', 'Mebendazole', 'Digestive Health', '100mg', 'Tablet', 'Cipla', 75, 'out_of_stock', True, 0, 'Anthelmintic for worm infections'),
    ('Loperamide', 'Loperamide', 'Digestive Health', '2mg', 'Tablet', 'Cipla', 50, 'in_stock', False, 95, 'Anti-diarrheal medication'),
    ('Simethicone', 'Simethicone', 'Digestive Health', '40mg', 'Tablet', 'Generic Pharma', 45, 'in_stock', False, 120, 'Gas relief'),
    ('Bisacodyl', 'Bisacodyl', 'Digestive Health', '5mg', 'Tablet', 'Generic Pharma', 55, 'in_stock', False, 80, 'Laxative for constipation'),

    # Heart Health (6)
    ('Atorvastatin', 'Atorvastatin', 'Heart Health', '10mg', 'Tablet', 'Cipla', 120, 'in_stock', True, 40, 'Statin for cholesterol management'),
    ('Lisinopril', 'Lisinopril', 'Heart Health', '5mg', 'Tablet', 'Cipla', 100, 'in_stock', True, 50, 'ACE inhibitor for hypertension'),
    ('Amlodipine', 'Amlodipine', 'Heart Health', '5mg', 'Tablet', 'Cipla', 105, 'in_stock', True, 45, 'Calcium channel blocker'),
    ('Metoprolol', 'Metoprolol', 'Heart Health', '50mg', 'Tablet', 'Cipla', 95, 'out_of_stock', True, 0, 'Beta blocker for heart health'),
    ('Clopidogrel', 'Clopidogrel', 'Heart Health', '75mg', 'Tablet', 'Cipla', 180, 'in_stock', True, 25, 'Blood thinner for heart protection'),
    ('Isosorbide', 'Isosorbide Dinitrate', 'Heart Health', '10mg', 'Sublingual Tablet', 'Cipla', 70, 'in_stock', True, 60, 'Nitrate for angina relief'),

    # Diabetes (6)
    ('Metformin', 'Metformin', 'Diabetes', '500mg', 'Tablet', 'Cipla', 90, 'in_stock', True, 80, 'First-line diabetes medication'),
    ('Glibenclamide', 'Glibenclamide', 'Diabetes', '5mg', 'Tablet', 'Cipla', 75, 'in_stock', True, 70, 'Sulfonylurea for blood sugar'),
    ('Insulin Regular', 'Insulin', 'Diabetes', '100IU/ml', 'Injection', 'Novo Nordisk', 350, 'in_stock', True, 20, 'Injectable insulin therapy'),
    ('Teneligliptin', 'Teneligliptin', 'Diabetes', '20mg', 'Tablet', 'Cipla', 140, 'out_of_stock', True, 0, 'DPP-4 inhibitor for diabetes'),
    ('Pioglitazone', 'Pioglitazone', 'Diabetes', '15mg', 'Tablet', 'Cipla', 125, 'in_stock', True, 35, 'Thiazolidinedione for insulin sensitivity'),
    ('Sitagliptin', 'Sitagliptin', 'Diabetes', '50mg', 'Tablet', 'Cipla', 150, 'in_stock', True, 30, 'DPP-4 inhibitor'),

    # Vitamins & Supplements (8)
    ('Vitamin C', 'Ascorbic Acid', 'Vitamins & Supplements', '500mg', 'Tablet', 'Generic Pharma', 40, 'in_stock', False, 200, 'Immune system support'),
    ('Vitamin D3', 'Cholecalciferol', 'Vitamins & Supplements', '1000IU', 'Tablet', 'Generic Pharma', 65, 'in_stock', False, 150, 'Calcium absorption and bone health'),
    ('Vitamin B12', 'Cyanocobalamin', 'Vitamins & Supplements', '1000mcg', 'Tablet', 'Cipla', 85, 'in_stock', False, 80, 'Energy and nerve health'),
    ('Multivitamin', 'Complete Vitamin Complex', 'Vitamins & Supplements', 'Complete Formula', 'Tablet', 'Generic Pharma', 120, 'in_stock', False, 100, 'Daily multivitamin complex'),
    ('Calcium Carbonate', 'Calcium Carbonate', 'Vitamins & Supplements', '500mg', 'Tablet', 'Generic Pharma', 55, 'out_of_stock', False, 0, 'Bone and muscle health'),
    ('Iron Supplement', 'Ferrous Sulfate', 'Vitamins & Supplements', '325mg', 'Tablet', 'Generic Pharma', 50, 'in_stock', False, 110, 'Anemia treatment and iron supplementation'),
    ('Zinc Gluconate', 'Zinc', 'Vitamins & Supplements', '15mg', 'Tablet', 'Generic Pharma', 45, 'in_stock', False, 130, 'Immune and wound healing support'),
    ('Magnesium', 'Magnesium Oxide', 'Vitamins & Supplements', '250mg', 'Tablet', 'Generic Pharma', 60, 'in_stock', False, 90, 'Muscle relaxation and nerve function'),

    # Skin Care (6)
    ('Hydrocortisone Cream', 'Hydrocortisone', 'Skin Care', '1%', 'Cream', 'Cipla', 85, 'in_stock', False, 50, 'Topical steroid for inflammation'),
    ('Clotrimazole', 'Clotrimazole', 'Skin Care', '1%', 'Cream', 'Cipla', 70, 'in_stock', False, 60, 'Antifungal treatment'),
    ('Benzoyl Peroxide', 'Benzoyl Peroxide', 'Skin Care', '2.5%', 'Gel', 'Generic Pharma', 95, 'in_stock', False, 40, 'Acne treatment'),
    ('Tretinoin', 'Tretinoin', 'Skin Care', '0.025%', 'Cream', 'Cipla', 140, 'out_of_stock', True, 0, 'Retinoid for skin renewal'),
    ('Calamine Lotion', 'Calamine', 'Skin Care', 'Lotion', 'Lotion', 'Generic Pharma', 50, 'in_stock', False, 80, 'Soothing lotion for rashes'),
    ('Salicylic Acid', 'Salicylic Acid', 'Skin Care', '2%', 'Wash', 'Generic Pharma', 65, 'in_stock', False, 70, 'Acne and exfoliating wash'),

    # Anti-Allergy (6)
    ('Chlorpheniramine', 'Chlorpheniramine', 'Anti-Allergy', '4mg', 'Tablet', 'Cipla', 55, 'in_stock', False, 100, 'First-generation antihistamine'),
    ('Fexofenadine', 'Fexofenadine', 'Anti-Allergy', '120mg', 'Tablet', 'Cipla', 110, 'in_stock', False, 60, 'Non-drowsy antihistamine'),
    ('Prednisolone', 'Prednisolone', 'Anti-Allergy', '5mg', 'Tablet', 'Cipla', 95, 'in_stock', True, 50, 'Corticosteroid for allergies'),
    ('Mometasone', 'Mometasone', 'Anti-Allergy', 'Nasal Spray', 'Spray', 'Cipla', 140, 'out_of_stock', True, 0, 'Nasal corticosteroid'),
    ('Promethazine', 'Promethazine', 'Anti-Allergy', '25mg', 'Tablet', 'Cipla', 70, 'in_stock', True, 65, 'Antihistamine and sedative'),
    ('Sodium Cromoglicate', 'Cromoglicate', 'Anti-Allergy', 'Nasal Spray', 'Spray', 'Generic Pharma', 85, 'in_stock', False, 45, 'Preventive allergy spray'),

    # Sleep & Nerves (6)
    ('Melatonin', 'Melatonin', 'Sleep & Nerves', '3mg', 'Tablet', 'Generic Pharma', 85, 'in_stock', False, 75, 'Natural sleep aid'),
    ('Diazepam', 'Diazepam', 'Sleep & Nerves', '5mg', 'Tablet', 'Cipla', 100, 'in_stock', True, 40, 'Benzodiazepine for anxiety and sleep'),
    ('Alprazolam', 'Alprazolam', 'Sleep & Nerves', '0.5mg', 'Tablet', 'Cipla', 95, 'out_of_stock', True, 0, 'Anti-anxiety medication'),
    ('Sertraline', 'Sertraline', 'Sleep & Nerves', '50mg', 'Tablet', 'Cipla', 120, 'in_stock', True, 50, 'SSRI antidepressant'),
    ('Fluoxetine', 'Fluoxetine', 'Sleep & Nerves', '20mg', 'Capsule', 'Cipla', 115, 'in_stock', True, 55, 'SSRI for depression and anxiety'),
    ('Valerian Root', 'Valerian', 'Sleep & Nerves', '500mg', 'Tablet', 'Generic Pharma', 70, 'in_stock', False, 85, 'Herbal sleep support'),
]

created_count = 0
for product_data in medicines:
    name, generic_name, category_name, strength, form, manufacturer, price, availability, requires_rx, stock, description = product_data
    
    try:
        product, created = Product.objects.get_or_create(
            name=name,
            generic_name=generic_name,
            defaults={
                'category': categories[category_name],
                'strength': strength,
                'form': form,
                'manufacturer': manufacturer,
                'price': price,
                'availability_status': availability,
                'requires_prescription': requires_rx,
                'stock': stock,
                'description': description
            }
        )
        if created:
            created_count += 1
            print(f'✓ Created: {name} ({strength}) - {manufacturer}')
    except Exception as e:
        print(f'✗ Error creating {name}: {str(e)}')

print(f'\n{"="*60}')
print(f'Successfully loaded {created_count} new medicines!')
print(f'Total medicines in database: {Product.objects.count()}')
print(f'Categories: {Category.objects.count()}')
print(f'In Stock: {Product.objects.filter(availability_status="in_stock").count()}')
print(f'Out of Stock: {Product.objects.filter(availability_status="out_of_stock").count()}')
print(f'Rx Required: {Product.objects.filter(requires_prescription=True).count()}')
print(f'{"="*60}')
