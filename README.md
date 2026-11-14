# Srayan Talukdar · 3D cockpit portfolio

An interactive portfolio: you sit in the jump seat of a Boeing 737-800 cockpit at sunset, and the center display runs a small desktop with my about page, projects, education, skills, CV and contact details.

Built with [Three.js](https://threejs.org) and plain HTML, CSS and JavaScript. No build step.

## Credits

- Cockpit model: [Boeing 737-800 Cockpit](https://sketchfab.com/3d-models/boeing-737-800-cockpit-d463256f98654b36af019d2d88bd5bbe) by **hakai315**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes: compressed with [gltfpack](https://github.com/zeux/meshoptimizer) (84 MB to 6 MB), seats recolored, live display images added.
- 3D engine: [Three.js](https://threejs.org) (MIT).

## Put it online with GitHub Pages (free)

1. Sign in to GitHub and create a **new repository** named exactly `VaporScope.github.io`. Make it **Public**.
2. In the new repo, click **Add file → Upload files**.
3. Drag in **all the files in this folder** (there are no subfolders). Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set *Source* to **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
5. Wait 1–2 minutes, then open `https://vaporscope.github.io`.

## Change the text

Everything the site says is in **`content.js`**: name, bio, projects, education, skills, CV files and links.

- Add your LinkedIn link in `PROFILE.linkedin`. Empty links are hidden.
- To add a project, copy one block inside `PROJECTS` and edit it.
- To update the CV, upload new PDFs with the same file names.

After editing, upload the changed file to the repo again (or edit it directly on GitHub with the pencil icon).

## Run it on your computer

Browsers block this kind of site when opened as a plain file, so start a tiny local server inside this folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## How it works

| File | What it does |
| --- | --- |
| `main.js` | Loads the scene, lighting, shadows and ambient occlusion; moves the camera; opens the desktop on the center display |
| `cockpit.js` | Loads the 737 model, recolors the seats and places the live display images on its screens |
| `cockpit.glb` | The compressed 3D cockpit model |
| `screens.js` | Draws the live cockpit displays (flight displays, maps, engines) |
| `sky.js` | Sunset sky and the cloud layer below, drawn by shaders |
| `os.js` | The desktop: windows, dock, terminal |
| `content.js` | All the text |

Privacy: the CV PDFs have no street address or phone number, and the email address is assembled by JavaScript so simple spam bots can't read it from the page source.
