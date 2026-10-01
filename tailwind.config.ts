import type {Config} from 'tailwindcss';
const config:Config={content:['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],theme:{extend:{colors:{kred:'#FF0033',kblack:'#080808',chrome:'#C0C0C0',chrome2:'#E8E8E8'},fontFamily:{display:['Anton','Impact','sans-serif'],sans:['Space Grotesk','Arial','sans-serif']},boxShadow:{neon:'0 0 40px rgba(255,0,51,.35)',chrome:'0 0 0 1px rgba(232,232,232,.18), inset 0 1px 0 rgba(255,255,255,.08)'}}},plugins:[]};
export default config;
