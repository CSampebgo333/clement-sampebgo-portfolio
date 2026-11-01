from pathlib import Path
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
R=Path(__file__).resolve().parents[1];(R/'documents').mkdir(exist_ok=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
pdfmetrics.registerFont(TTFont('CV',font));pdfmetrics.registerFont(TTFont('CVBold',bold));pdfmetrics.registerFontFamily('CV',normal='CV',bold='CVBold')
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='BodyCV',fontName='CV',fontSize=9,leading=13,spaceAfter=5,textColor=colors.HexColor('#202b3c')));styles.add(ParagraphStyle(name='HeadingCV',fontName='CVBold',fontSize=10,leading=14,spaceBefore=12,spaceAfter=7,textColor=colors.HexColor('#174cad')));styles.add(ParagraphStyle(name='NameCV',fontName='CVBold',fontSize=23,leading=29,spaceAfter=6));styles.add(ParagraphStyle(name='RoleCV',fontName='CVBold',fontSize=9,leading=13,spaceAfter=5))
D={'en': {'subtitle': 'Computer Science | Data Science | Applied AI',
        'profile': 'Final-year Computer Science student at Ashesi University, graduating in June 2027. Experience in '
                   'data analysis, document AI, relational databases and multilingual benchmark construction. '
                   'Bilingual in French and English.',
        'heads': ['PROFILE',
                  'EDUCATION',
                  'RESEARCH',
                  'EXPERIENCE',
                  'LEADERSHIP & SERVICE',
                  'AWARDS & RECOGNITION',
                  'TRAINING & CERTIFICATIONS',
                  'TECHNICAL SKILLS'],
        'education': '<b>Ashesi University</b>, Berekuso, Ghana | BSc Computer Science<br/>Expected graduation: June '
                     '2027 | Mastercard Foundation Scholar',
        'researchTitle': 'Global PIQA | Contributing author | 2026',
        'research': ['Contributed to the Zarma dataset with M. K. Keita, preparing prompts and filtering and '
                     'formatting LLM-generated examples. Reviewed French seed examples for cultural relevance.',
                     'Paper: Global PIQA: Evaluating Commonsense Reasoning Across 100+ Languages and Cultures. NeurIPS '
                     '2026 Evaluations & Datasets Track acceptance reported in the supplied CV.',
                     'Preprint: arxiv.org/abs/2510.24081 | Contribution scope: Zarma examples within an international '
                     'collaboration.'],
        'roles': [('Pfizer, via Extern | AI-Powered Document Insights & Data Extraction',
                   'July - October 2026',
                   ['Developed a Python prototype combining PDF extraction, OCR and semantic retrieval.',
                    'Connected local language-model generation to a Gradio interface with source-page inspection.',
                    'Evaluated retrieval and answer quality separately and documented technical trade-offs.']),
                  ('Breaking Games, via Extern | SQL & Database Architecture',
                   'July - September 2026',
                   ['Designed a relational analytics database in SQLite with dimension and fact tables.',
                    'Used SQL joins, window functions and validation queries to check data consistency and metric '
                    'definitions.',
                    'Built a reporting layer and an HTML/Chart.js dashboard; practiced communicating assumptions and '
                    'limitations.']),
                  ('National Geographic Society + TNC | Marine & Community Conservation',
                   'September - November 2025',
                   ['Synthesized published reporting and existing community footage into three research records on '
                    'conservation issues at Tanghin Dam.',
                    'Created a public ArcGIS StoryMap and recorded a short presentation connecting environmental '
                    'pressures, fishing livelihoods and community responses.']),
                  ('Beats by Dre, via Extern | Consumer Insights Data Analytics',
                   'June 24 - July 29, 2024',
                   ['Analyzed consumer reviews using Python, exploratory analysis and NLP, including Gemini AI.',
                    'Developed visualizations and recommendations intended to inform brand decisions.'])],
        'service': ['<b>Peer Tutor, Ashesi University</b> | June 2024 - Present: facilitate interactive Python '
                    'sessions for Introduction to Computing and Information Systems.',
                    '<b>Youths4Change Initiative, Ashesi University</b> | December 2024 - Present: mobilize peers and '
                    'support awareness and educational activities.'],
        'awards': ['Mastercard Foundation Scholar, Ashesi University | 2023 - 2027',
                   'French Government Scholarship, CESI Graduate School of Engineering | 2025 - 2026 (as listed in '
                   'supplied English CV)',
                   'Exchange program nomination, CESI Aix-en-Provence | 2024 - 2025',
                   'Dean’s List, Ashesi University | Semesters 1 and 3'],
        'cert': ['Google Data Analytics Professional Certificate | Completed December 30, 2024',
                 'Prompt Engineering for ChatGPT, Vanderbilt University / Coursera | January 24, 2025',
                 'Business Development Module, One Percent Club | May 2023'],
        'skills': ['<b>Programming:</b> Python, SQL, Java, C++, C, JavaScript, R',
                   '<b>AI & data:</b> OCR, RAG, NLP, LlamaIndex, Pandas, Matplotlib, Tableau, Chart.js; multilingual '
                   'evaluation',
                   '<b>Databases & web:</b> SQLite, relational design, dimensional modeling, HTML, CSS, React, Next.js',
                   '<b>Tools:</b> Git, Jupyter Notebook, RStudio, DB Browser for SQLite',
                   '<b>Languages:</b> French (native), English (professional proficiency)']},
 'fr': {'subtitle': 'Informatique | Science des données | IA appliquée',
        'profile': 'Étudiant en dernière année d’informatique à l’Université Ashesi, diplôme prévu en juin 2027. '
                   'Expérience en analyse de données, IA documentaire, bases relationnelles et création de benchmarks '
                   'multilingues. Bilingue français-anglais.',
        'heads': ['PROFIL',
                  'FORMATION',
                  'RECHERCHE',
                  'EXPÉRIENCE',
                  'ENGAGEMENT & TRANSMISSION',
                  'BOURSES & DISTINCTIONS',
                  'FORMATIONS & CERTIFICATIONS',
                  'COMPÉTENCES TECHNIQUES'],
        'education': '<b>Université Ashesi</b>, Berekuso, Ghana | BSc en informatique<br/>Diplôme prévu en juin 2027 | '
                     'Boursier de la Mastercard Foundation',
        'researchTitle': 'Global PIQA | Coauteur contributeur | 2026',
        'research': ['Contribution au jeu de données zarma avec M. K. Keita : préparation de prompts, filtrage et mise '
                     'en forme d’exemples générés par des LLM. Relecture d’exemples sources en français pour leur '
                     'pertinence culturelle.',
                     'Article : Global PIQA: Evaluating Commonsense Reasoning Across 100+ Languages and Cultures. '
                     'Acceptation à NeurIPS 2026, piste Evaluations & Datasets, indiquée dans le CV fourni.',
                     'Préprint : arxiv.org/abs/2510.24081 | Contribution aux exemples zarma au sein d’une '
                     'collaboration internationale.'],
        'roles': [('Pfizer, via Extern | IA documentaire et extraction de données',
                   'Juillet - octobre 2026',
                   ['Développement d’un prototype Python associant extraction PDF, OCR et recherche sémantique.',
                    'Intégration d’un modèle de langage local à une interface Gradio avec consultation des pages '
                    'sources.',
                    'Évaluation distincte de la recherche et des réponses ; documentation des compromis techniques.']),
                  ('Breaking Games, via Extern | SQL et architecture de bases de données',
                   'Juillet - septembre 2026',
                   ['Conception d’une base analytique relationnelle SQLite avec tables de dimensions et de faits.',
                    'Utilisation de jointures SQL, de fonctions de fenêtrage et de requêtes de validation pour '
                    'vérifier les données et les indicateurs.',
                    'Création d’une couche de reporting et d’un tableau de bord HTML/Chart.js ; présentation des '
                    'hypothèses et des limites.']),
                  ('National Geographic Society + TNC | Conservation marine et communautaire',
                   'Septembre - novembre 2025',
                   ['Synthèse de publications et de vidéos communautaires existantes dans trois fiches de recherche '
                    'sur les enjeux de conservation du barrage de Tanghin.',
                    'Création d’un ArcGIS StoryMap public et d’une présentation enregistrée reliant pressions '
                    'environnementales, pêche et réponses communautaires.']),
                  ('Beats by Dre, via Extern | Analyse des avis consommateurs',
                   '24 juin - 29 juillet 2024',
                   ['Analyse des avis clients avec Python, l’exploration de données et le NLP, notamment Gemini AI.',
                    'Production de visualisations et de recommandations destinées à éclairer les décisions de '
                    'marque.'])],
        'service': ['<b>Tuteur pair, Université Ashesi</b> | Juin 2024 - aujourd’hui : animation de séances '
                    'interactives de Python pour le cours Introduction to Computing and Information Systems.',
                    '<b>Membre de Youths4Change, Université Ashesi</b> | Décembre 2024 - aujourd’hui : mobilisation '
                    'des pairs et soutien aux actions de sensibilisation et d’éducation.'],
        'awards': ['Bourse de la Mastercard Foundation, Université Ashesi | 2023 - 2027',
                   'Bourse du gouvernement français, CESI | 2025 - 2026 (selon le CV anglais fourni)',
                   'Nomination pour un programme d’échange, CESI Aix-en-Provence | 2024 - 2025',
                   'Dean’s List, Université Ashesi | Semestres 1 et 3'],
        'cert': ['Google Data Analytics Professional Certificate | Terminé le 30 décembre 2024',
                 'Prompt Engineering for ChatGPT, Université Vanderbilt / Coursera | 24 janvier 2025',
                 'Module Business Development, One Percent Club | Mai 2023'],
        'skills': ['<b>Programmation :</b> Python, SQL, Java, C++, C, JavaScript, R',
                   '<b>IA et données :</b> OCR, RAG, NLP, LlamaIndex, Pandas, Matplotlib, Tableau, Chart.js ; '
                   'évaluation multilingue',
                   '<b>Bases de données et web :</b> SQLite, conception relationnelle, modélisation dimensionnelle, '
                   'HTML, CSS, React, Next.js',
                   '<b>Outils :</b> Git, Jupyter Notebook, RStudio, DB Browser for SQLite',
                   '<b>Langues :</b> français (langue maternelle), anglais (niveau professionnel)']}}
for lang,d in D.items():
 flow=[]
 def p(txt,style='BodyCV'):flow.append(Paragraph(txt,styles[style]))
 def h(i):p(d['heads'][i],'HeadingCV')
 def bullet(txt):p('• '+txt)
 p('CLÉMENT SAMPEBGO','NameCV');p(d['subtitle'],'RoleCV');p('Berekuso, Ghana | cl.sampebgo@gmail.com<br/>github.com/CSampebgo333 | linkedin.com/in/clement-sampebgo')
 h(0);p(d['profile']);h(1);p(d['education']);h(2);p(d['researchTitle'],'RoleCV')
 for txt in d['research']:bullet(txt)
 h(3)
 for title,date,bullets in d['roles'][:2]:
  p(title,'RoleCV');p(date)
  for txt in bullets:bullet(txt)
 flow.append(PageBreak())
 p('CLÉMENT SAMPEBGO','NameCV');p(d['subtitle'],'RoleCV');h(3)
 for title,date,bullets in d['roles'][2:]:
  p(title,'RoleCV');p(date)
  for txt in bullets:bullet(txt)
 for i,key in [(4,'service'),(5,'awards'),(6,'cert'),(7,'skills')]:
  h(i)
  for txt in d[key]:p(txt)
 def footer(canvas,doc):
  canvas.setFont('CV',8);canvas.setFillColor(colors.HexColor('#586477'));canvas.drawString(42,24,'Clément Sampebgo');canvas.drawRightString(553,24,str(doc.page))
 doc=SimpleDocTemplate(str(R/f'documents/clement-sampebgo-cv-{lang}.pdf'),pagesize=(595.28,841.89),rightMargin=42,leftMargin=42,topMargin=35,bottomMargin=40,title='Clément Sampebgo - CV '+lang.upper(),author='Clément Sampebgo');doc.build(flow,onFirstPage=footer,onLaterPages=footer)
 print(lang,'CV complete')
