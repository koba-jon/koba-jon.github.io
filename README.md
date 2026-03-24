# Refactored site files

This package reorganizes the site into:

- `assets/css/main.css` for global layout
- `assets/css/components.css` for reusable UI pieces
- `assets/css/pages/*.css` for page-specific styling
- `assets/js/main.js` for shared site chrome
- `assets/js/components/*.js` for reusable behavior
- `assets/js/pages/*.js` for page-specific logic
- `assets/data/*.json` for structured content

## Notes

- Inline `onclick` handlers were removed.
- Shared header / nav / footer are generated centrally in `assets/js/main.js`.
- Publications tabs now use `data-tab` + event listeners.
- `publications-journal.json` and `publications-domestic.json` are left empty because their original contents were not available in the fetched repository snapshot I used for this package.
