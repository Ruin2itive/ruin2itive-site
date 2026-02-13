:root{
  --ink:#0f0f0f;
  --muted:#6a6a6a;
  --hair:#dadada;
  --accent:#7a2f2f; /* blood-oxide */
  --paper:#ffffff;

  /* watermark */
  --wm-opacity:0.16;  /* increase/decrease watermark strength */
  --wm-blur:0px;
  --wm-scale:1.15;
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  color:var(--ink);
  background:var(--paper);
  font-family: Georgia, "Times New Roman", serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.page{
  position:relative;
  max-width: 920px;
  margin: 0 auto;
  padding: 22px 16px 42px;
}

/* Full-page elephant watermark + film grain */
.page::before{
  content:"";
  position:fixed;
  inset:0;
  z-index:-2;
  background:
    url("./assets/elephant-third-eye.webp") center 160px / calc(1200px * var(--wm-scale)) auto no-repeat;
  opacity: var(--wm-opacity);
  filter: blur(var(--wm-blur));
  pointer-events:none;
}
.page::after{
  /* subtle 35mm grain overlay */
  content:"";
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  opacity:0.14;
  background-image:
    radial-gradient(circle at 20% 10%, rgba(0,0,0,0.08) 0 1px, transparent 2px),
    radial-gradient(circle at 80% 30%, rgba(0,0,0,0.06) 0 1px, transparent 2px),
    radial-gradient(circle at 40% 70%, rgba(0,0,0,0.05) 0 1px, transparent 2px),
    radial-gradient(circle at 60% 90%, rgba(0,0,0,0.04) 0 1px, transparent 2px);
  background-size: 140px 140px, 190px 190px, 220px 220px, 260px 260px;
}

.mast{padding-bottom:10px}
.brand__name{
  font-size: 56px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 0 0 6px;
  text-transform: lowercase;
  /* “Clerks-ish” fallback stack if available locally */
  font-family: "Cooper Black", "CooperBlack", Georgia, "Times New Roman", serif;
}
.brand__tag{
  font-size: 14px;
  letter-spacing: 2.2px;
  text-transform: lowercase;
  color: var(--muted);
  margin-bottom: 12px;
}

.rule{
  height:2px;
  background: var(--ink);
  opacity:0.9;
  margin: 10px 0 14px;
}

/* Thesis block: compact + strong left bar */
.thesis{
  display:flex;
  gap:12px;
  align-items:flex-start;
  border:1px solid rgba(0,0,0,0.16);
  background: rgba(255,255,255,0.72);
  padding: 12px 12px;
}
.thesis__bar{
  width:4px;
  background: var(--accent);
  flex:0 0 4px;
  border-radius:2px;
  margin-top:2px;
}
.thesis__text p{
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.22;
}
.thesis__text p:last-child{margin-bottom:0}

.section{
  margin-top: 16px;
}

.section__title{
  margin: 14px 0 8px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 4px;
  text-transform: lowercase;
  color: var(--accent);
  border-bottom: 1px solid rgba(0,0,0,0.18);
  padding-bottom: 6px;
}

.list, .feed{
  border-top: 0;
}

.item{
  display:block;
  padding: 10px 0 9px;
  border-bottom: 1px solid rgba(0,0,0,0.10);
  text-decoration:none;
  color:inherit;
  background: rgba(255,255,255,0.55);
}
.item__title{
  font-size: 30px;
  font-weight: 800;
  line-height: 1.06;
  text-transform: lowercase;
  margin: 0 0 4px;
}
.item__meta{
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 2px;
  text-transform: lowercase;
}

.feed .item__title{
  font-size: 30px;
}
.feed .item__meta{
  display:flex;
  gap:10px;
  align-items:center;
  flex-wrap:wrap;
}

.pill{
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: lowercase;
}

a.item:hover{opacity:0.92}

.foot{
  margin-top: 22px;
  padding-top: 10px;
}
.foot__rule{
  height:1px;
  background: rgba(0,0,0,0.22);
  margin-bottom: 8px;
}
.foot__meta{
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: lowercase;
  color: var(--muted);
}

/* Mobile tightening */
@media (max-width: 520px){
  .brand__name{font-size: 52px}
  .thesis__text p{font-size: 17px}
  .item__title{font-size: 28px}
  .page{padding-top:18px}
}
