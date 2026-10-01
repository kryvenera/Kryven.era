export type Product={id:string;name:string;category:string;price:number;mrp:number;discount:string;rating:number;reviews:number;barcode:string;images:string[];sizes:Record<string,boolean>;colors:string[];description:string;features:string[];stock:number};
const IMG={
 hero:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=85',
 tshirt:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',
 hoodie:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85',
 pants:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85',
 jacket:'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85',
 cap:'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=85'
};
export const PRODUCTS:Product[]=[
{id:'KE001',name:'Kryven Era Logo Tee',category:'T-Shirts',price:1299,mrp:1999,discount:'35% OFF',rating:4.8,reviews:124,barcode:'890100000001',images:[IMG.tshirt,IMG.hero,IMG.jacket],sizes:{S:true,M:true,L:true,XL:true,XXL:false},colors:['Black','White','Silver','Red'],description:'Oversized premium-cotton tee with a minimal metallic K mark. Designed for a clean, heavyweight silhouette.',features:['100% premium cotton','Oversized fit','Breathable & soft','Machine washable'],stock:18},
{id:'KE002',name:'Kryven Signature Hoodie',category:'Hoodies',price:2499,mrp:3199,discount:'22% OFF',rating:4.7,reviews:88,barcode:'890100000002',images:[IMG.hoodie,IMG.hero,IMG.jacket],sizes:{S:true,M:true,L:true,XL:false,XXL:true},colors:['Black','Stone'],description:'Premium fleece hoodie with structured shoulders, brushed interior and a subtle front signature.',features:['480 GSM fleece','Drop shoulder','Soft brushed inside','Relaxed fit'],stock:9},
{id:'KE003',name:'Kryven Era Cargo Pants',category:'Pants',price:1999,mrp:2599,discount:'23% OFF',rating:4.6,reviews:67,barcode:'890100000003',images:[IMG.pants,IMG.hero,IMG.jacket],sizes:{S:false,M:true,L:true,XL:true,XXL:true},colors:['Black','Graphite'],description:'Tapered cargo pants with utility pockets, articulated knees and a refined matte finish.',features:['Utility pocket system','Tapered leg','Stretch comfort','Everyday streetwear'],stock:14},
{id:'KE004',name:'Kryven Windcheater Jacket',category:'Jackets',price:2799,mrp:4299,discount:'35% OFF',rating:4.5,reviews:49,barcode:'890100000004',images:[IMG.jacket,IMG.hero,IMG.hoodie],sizes:{S:true,M:true,L:true,XL:true,XXL:true},colors:['Black','Silver'],description:'Lightweight shell jacket with reflective details and a sleek monochrome finish.',features:['Lightweight shell','Reflective trims','Water resistant','Zip pockets'],stock:22},
{id:'KE005',name:'Kryven Era Cap',category:'Accessories',price:999,mrp:1299,discount:'23% OFF',rating:4.4,reviews:31,barcode:'890100000005',images:[IMG.cap,IMG.tshirt,IMG.hero],sizes:{S:true,M:true,L:false,XL:false,XXL:false},colors:['Black','Gold'],description:'Structured 6-panel cap with embroidered K mark and metal adjuster.',features:['Cotton twill','Structured crown','Metal adjuster','Embroidered mark'],stock:30}
];
export const settings={brand:'KRYVEN ERA',tagline:'WEAR YOUR ERA',heroTitle:'OWN THE NIGHT.',heroText:'Luxury streetwear engineered for presence.',whatsapp:'7036421785',upi:'kryvenera@upi',currency:'₹',shipping:0,searchSuggestions:['oversized t-shirt','black hoodie','cargo pants','kryven era']};
export const colorMap:Record<string,string>={Black:'#050505',White:'#f4f4f4',Silver:'#c0c0c0',Red:'#ff0033',Stone:'#777',Graphite:'#242424',Gold:'#c9a227'};
export const sizeChartByCategory={
 'T-Shirts':[['S','38','26','8'],['M','40','27','8.5'],['L','42','28','9'],['XL','44','29','9.5'],['XXL','46','30','10']],
 Hoodies:[['S','40','26','8'],['M','42','27','8.5'],['L','44','28','9'],['XL','46','29','9.5'],['XXL','48','30','10']],
 Pants:[['S','28','39','-'],['M','30','40','-'],['L','32','41','-'],['XL','34','42','-'],['XXL','36','43','-']],
 Jackets:[['S','38','25','8'],['M','40','26','8.5'],['L','42','27','9'],['XL','44','28','9.5'],['XXL','46','29','10']],
 Accessories:[['S','54','-','-'],['M','56','-','-'],['L','58','-','-'],['XL','60','-','-'],['XXL','62','-','-']]
};
