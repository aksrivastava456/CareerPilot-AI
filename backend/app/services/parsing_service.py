import re

SECTION_PATTERNS = {
    "summary": re.compile(r"^\b(summary|professional summary|profile|objective|about me)\b", re.IGNORECASE),
    "experience": re.compile(r"^\b(experience|work experience|employment history|professional experience|work history|career history|background)\b", re.IGNORECASE),
    "education": re.compile(r"^\b(education|academic background|credentials|qualifications|academic details)\b", re.IGNORECASE),
    "skills": re.compile(r"^\b(skills|technical skills|core competencies|technologies|expertise|skills & expertise|skills and tools)\b", re.IGNORECASE),
    "projects": re.compile(r"^\b(projects|academic projects|key projects|personal projects|key achievements)\b", re.IGNORECASE),
    "certifications": re.compile(r"^\b(certifications|licenses|certifications & licenses|awards|honors|achievements)\b", re.IGNORECASE),
    "other": re.compile(r"^\b(languages|interests|hobbies|volunteering|extra-curriculars|affiliations|personal details)\b", re.IGNORECASE)
}

def parse_sections(text: str) -> dict[str, str]:
    lines = text.split("\n")
    sections = {}
    current_section = "general"
    current_content = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if stripped line looks like a header (short and matches pattern)
        matched = False
        words = stripped.split()
        if len(words) > 0 and len(words) <= 4:
            # Remove trailing colon if present for cleaner matching
            clean_word = stripped.rstrip(":")
            for sec_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(clean_word):
                    if current_content:
                        sections[current_section] = sections.get(current_section, "") + "\n" + "\n".join(current_content)
                    current_section = sec_name
                    current_content = []
                    matched = True
                    break
        
        if not matched:
            current_content.append(line)
            
    if current_content:
        sections[current_section] = sections.get(current_section, "") + "\n" + "\n".join(current_content)
        
    return {k: v.strip() for k, v in sections.items() if v.strip()}
