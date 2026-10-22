from __future__ import annotations
import argparse
import json
import re
import unicodedata
from pathlib import Path

def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")

def clean_note(text: str) -> str:
    text = re.sub(r"\A---\s*\n.*?\n---\s*\n", "", text, flags=re.S)
    text = re.sub(r"!\[\[[^\]]+\]\]", "", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)
    text = re.sub(r"(?m)^\s*#\s+.*\n", "", text, count=1)
    text = re.sub(r"(?ms)^## Índice\s*\n.*?(?=^## |\Z)", "", text)
    text = re.sub(r"(?m)^\s*\[\[DPM - 00 - Inicio\|.*$", "", text)
    return text.strip()

def read_notes(source: Path) -> list[dict]:
    notes = []
    for path in sorted(source.glob("DPM - *.md")):
        if path.name.startswith("DPM - L"):
            continue
        raw = path.read_text(encoding="utf-8-sig")
        title_match = re.search(r"(?m)^#\s+(.+)$", raw)
        title = title_match.group(1).strip() if title_match else path.stem
        notes.append({
            "id": slugify(path.stem),
            "title": title,
            "source": path.name,
            "content": clean_note(raw),
            "editorialStatus": "Importado do Obsidian · aguardando revisão didática e jurídica",
        })
    return notes

def read_articles(source: Path) -> list[dict]:
    articles = []
    law_dir = source / "Lei literal"
    for path in sorted(law_dir.glob("DPM - L*.md")):
        raw = path.read_text(encoding="utf-8-sig")
        title_match = re.search(r"(?m)^#\s+(.+)$", raw)
        group = title_match.group(1).strip() if title_match else path.stem
        matches = list(re.finditer(r"(?m)^##\s+(Art\.\s*[\d]+(?:-[A-Za-z]+)?[^\n]*)\s*$", raw))
        for i, match in enumerate(matches):
            end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
            heading = match.group(1).strip()
            number = re.search(r"Art\.\s*([\d]+(?:-[A-Za-z]+)?)", heading, re.I).group(1)
            section = raw[match.end():end].strip()
            section = re.sub(r"!\[\[[^\]]+\]\]", "", section)
            section = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", section)
            articles.append({
                "id": "art-" + slugify(number),
                "number": number,
                "heading": heading,
                "group": group,
                "source": path.name,
                "content": section,
                "editorialStatus": "Importado · revisão jurídica pendente",
            })
    return articles

def read_questions(source: Path) -> tuple[list[dict], list[dict]]:
    path = source / "DPM - 13 - Fixacao.md"
    text = path.read_text(encoding="utf-8-sig")
    statements = {int(n): body.strip() for n, body in re.findall(r"(?m)^\*\*(\d+)\.\*\*\s+(.+)$", text)}
    answers = {}
    for n, label, body in re.findall(r"(?m)^\*\*(\d+)\s*[—–-]\s*(Certo|Errado)\.\*\*\s*(.+)$", text):
        answers[int(n)] = (label == "Certo", body.strip())
    topics = {
        **{n: "Aplicação da lei" for n in range(1, 5)},
        **{n: "Art. 9º e classificação" for n in range(5, 9)},
        **{n: "Teoria do crime" for n in range(9, 14)},
        14: "Imputabilidade",
        15: "Concurso de agentes",
        16: "Concurso de agentes",
        17: "Penas",
        18: "Aplicação da pena",
        19: "Medidas de segurança",
        20: "Ação penal",
        21: "Crimes em paz",
        22: "Crimes em paz",
        23: "Administração Militar",
        24: "Extinção da punibilidade",
        25: "Atualização jurídica",
        26: "Prescrição",
    }
    questions = []
    for n in sorted(statements):
        if n not in answers:
            continue
        correct, feedback = answers[n]
        article_refs = re.findall(r"arts?\.?\s*([\d]+(?:-[A-Za-z]+)?(?:\s*[–—-]\s*[\d]+)?)", feedback, re.I)
        questions.append({
            "id": f"item-{n:02}",
            "number": n,
            "statement": statements[n],
            "correct": correct,
            "feedback": feedback,
            "topic": topics.get(n, "Direito Penal Militar"),
            "articles": article_refs,
            "origin": "Autoral",
            "version": 1,
            "editorialStatus": "Em revisão" if n == 25 else "Importado · revisão jurídica pendente",
        })
    case_block = re.search(r"(?ms)^## 3\. Três casos.*?\n(.*?)(?=^## |\Z)", text)
    cases = []
    if case_block:
        for label, body in re.findall(r"(?m)^\*\*(Caso [ABC]):\*\*\s*(.+)$", case_block.group(1)):
            cases.append({"id": slugify(label), "title": label, "content": body.strip(), "origin": "Autoral"})
    return questions, cases

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", default=Path("data/content.json"), type=Path)
    args = parser.parse_args()
    source = args.source
    notes = read_notes(source)
    articles = read_articles(source)
    questions, cases = read_questions(source)
    payload = {
        "metadata": {
            "exam": "PMAL · Soldado",
            "boardFocus": "Cebraspe",
            "sourceDate": "2026-10-22",
            "sourceNotes": len(notes) + len(list((source / "Lei literal").glob("DPM - L*.md"))),
            "articles": len(articles),
            "questions": len(questions),
            "cases": len(cases),
            "editorialNote": "Conteúdo importado das anotações. A revisão jurídica é editorial e manual; esta publicação não monitora alterações automaticamente.",
        },
        "notes": notes,
        "articles": articles,
        "questions": questions,
        "cases": cases,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(payload["metadata"], ensure_ascii=False))

if __name__ == "__main__":
    main()