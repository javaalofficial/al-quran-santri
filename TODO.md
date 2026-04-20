# File Organization for al-quran-santri - fundraiser-master

## Progress: Approved plan - Tidy HTML files into pages/ folder

**Completed:**
- [x] Plan created and approved by user

**Remaining Steps:**
1. [ ] Create `fundraiser-master/pages/` directory
2. [ ] Move all .html files (except index.html & vercel.json) to `pages/`
3. [ ] Update nav links in `index.html` (href="page.html" → "pages/page.html")
4. [ ] Update nav links in ALL `pages/*.html` files:
   - Inter-page: "page.html" → "pages/page.html"
   - Home: "index.html" stays
5. [ ] Update blog.html specific links (e.g., href="berantas-huruf.html" → "pages/berantas-huruf.html")
6. [ ] Verify all links work via browser preview
7. [ ] Update TODO with completion

**Notes:**
- Assets (css/, js/, images/) stay in root - relative paths unchanged
- vercel.json unchanged (static hosting compatible)
- Pattern-based edits using exact string matches
