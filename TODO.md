# TODO: Integrate Form to Google Sheets

## Completed
- [x] Create TODO.md
- [x] Edit form.html with Google Sheets integration
- [x] Edit program.html with Google Sheets integration

## Remaining
1. **Test Form Submission**:
   - Fill form in `form.html` or `program.html`.
   - Submit → Check your Google Sheet for new row (with timestamp + all fields).
   - Verify redirect to konfirmasi.html/thankyou.html works.

2. **Deploy & Live Test** (if using Vercel):
   ```
   cd fundraiser-master
   vercel --prod
   ```
   Test live form.

3. **Optional Improvements**:
   - Add email notifications in GAS `doPost`.
   - Customize Sheet columns to match fields.
   - Add form validation enhancements.

Task complete when Sheets receive data automatically!
