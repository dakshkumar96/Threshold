# STAGE 04 — Dynamic skills + PDF CV

## Goal
For any role query, derive skill frequencies from that role’s job ads and parse an uploaded CV PDF.

## Inputs
- Live Reed/Adzuna jobs for the role
- Optional CV PDF

## Tasks
- [x] Extract frequent skill-like terms from JD text (role-agnostic)
- [x] Normalise variants (PowerBI → Power BI, MS Excel → Excel)
- [x] Flag essential/desirable when nearby wording exists
- [x] `pdfplumber` CV text extraction
- [x] Match CV text → has / lacks vs top role skills
- [x] Update ACCURACY notes for dynamic skills limits

## Outputs
- `src/dynamic_skills.py`, `src/parse_cv.py`
- Role skill frequency table in API response

## Limitations
- API JDs often truncated (~500 chars)
- Keyword extraction is imperfect

## Done when
Any role returns a skill frequency list derived from that role’s postings; PDF CV text can be parsed.
