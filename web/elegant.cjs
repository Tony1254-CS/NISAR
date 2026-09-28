const fs = require('fs');

let text = fs.readFileSync('d:/nasa 2026/web/src/pages/Landing.tsx', 'utf8');

// Find the hero section
const startStr = "      {/* \uFFFD ?\uFFFD ?\uFFFD ?\uFFFD ? Hero \uFFFD ?\uFFFD ?\uFFFD ?\uFFFD ? */}";
// Wait, the comment might be corrupted or just use `<section style={{ position: 'relative'`
const sectionStart = text.indexOf("<section style={{ position: 'relative'");
if (sectionStart === -1) {
    console.error("Could not find hero section");
    process.exit(1);
}

const sectionEndStr = "</section>";
const sectionEnd = text.indexOf(sectionEndStr, sectionStart) + sectionEndStr.length;

if (sectionEnd <= sectionEndStr.length) {
    console.error("Could not find end of hero section");
    process.exit(1);
}

const newHero = `<section style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
        <style>
          {\`
            @keyframes subtle-sweep {
              0% { transform: translateX(-100%) rotate(15deg); opacity: 0; }
              50% { opacity: 0.15; }
              100% { transform: translateX(200%) rotate(15deg); opacity: 0; }
            }
            @keyframes pulse-mesh {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(1.05); }
            }
            @keyframes float-up {
              0% { opacity: 0; transform: translateY(30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .elegant-bg {
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at 50% 0%, #0c1824 0%, #000000 70%);
              z-index: 0;
            }
            .radar-light {
              position: absolute;
              top: -50%; bottom: -50%;
              left: 0; width: 200px;
              background: linear-gradient(90deg, transparent, #39C4D9, transparent);
              filter: blur(50px);
              animation: subtle-sweep 8s infinite ease-in-out;
              z-index: 1;
            }
            .grid-mesh {
              position: absolute;
              inset: 0;
              background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
              background-size: 60px 60px;
              background-position: center center;
              mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
              -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
              z-index: 1;
              animation: pulse-mesh 10s infinite ease-in-out;
            }
            .hero-content-elegant {
              position: relative;
              z-index: 10;
              text-align: center;
              max-width: 900px;
              padding: 0 2rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2rem;
              animation: float-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .eyebrow {
              color: #39C4D9;
              font-size: 0.8rem;
              font-weight: 600;
              letter-spacing: 0.3em;
              text-transform: uppercase;
              background: rgba(57, 196, 217, 0.1);
              padding: 6px 16px;
              border-radius: 100px;
              border: 1px solid rgba(57, 196, 217, 0.2);
              backdrop-filter: blur(10px);
            }
            .headline {
              font-size: clamp(3.5rem, 8vw, 6rem);
              font-weight: 800;
              line-height: 1.1;
              color: #ffffff;
              letter-spacing: -0.02em;
              margin: 0;
            }
            .headline-gradient {
              background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .headline-accent {
              background: linear-gradient(135deg, #39C4D9 0%, #3b82f6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .subheadline {
              font-size: clamp(1.1rem, 2vw, 1.4rem);
              line-height: 1.6;
              color: #94a3b8;
              max-width: 700px;
              margin: 0;
              font-weight: 400;
            }
            .btn-group {
              display: flex;
              gap: 1.5rem;
              margin-top: 1rem;
            }
            .btn-elegant-primary {
              background: #ffffff;
              color: #000000;
              padding: 16px 32px;
              border-radius: 100px;
              font-weight: 600;
              font-size: 1.1rem;
              text-decoration: none;
              transition: all 0.3s ease;
              box-shadow: 0 0 20px rgba(255,255,255,0.2);
            }
            .btn-elegant-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 0 30px rgba(255,255,255,0.4);
            }
            .btn-elegant-secondary {
              background: rgba(255,255,255,0.05);
              color: #ffffff;
              padding: 16px 32px;
              border-radius: 100px;
              font-weight: 600;
              font-size: 1.1rem;
              text-decoration: none;
              border: 1px solid rgba(255,255,255,0.1);
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
            }
            .btn-elegant-secondary:hover {
              background: rgba(255,255,255,0.1);
              border-color: rgba(255,255,255,0.2);
            }
          \`}
        </style>

        <div className="elegant-bg" />
        <div className="grid-mesh" />
        <div className="radar-light" />

        <div className="hero-content-elegant">
          <div className="eyebrow">
            GLOBAL CHANGE INTELLIGENCE
          </div>

          <h1 className="headline">
            <span className="headline-gradient">See the invisible.</span><br />
            <span className="headline-accent">Predict the inevitable.</span>
          </h1>

          <p className="subheadline">
            A cloud-native intelligence platform leveraging NISAR L-band radar to quantify global surface changes. From river erosion to glacial retreat, our ML engine decodes the physics of a transforming planet.
          </p>

          <div className="btn-group">
            <a href="/cases" className="btn-elegant-primary">
              Begin Investigation
            </a>
            <a href="/methods" className="btn-elegant-secondary">
              How it works
            </a>
          </div>
        </div>
      </section>`;

text = text.substring(0, sectionStart) + newHero + text.substring(sectionEnd);

fs.writeFileSync('d:/nasa 2026/web/src/pages/Landing.tsx', text);
console.log("done");
