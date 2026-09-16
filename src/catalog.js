export const materials={
  PLA:{price:0,note:'Simple, rigid, and ideal for everyday indoor parts.'},
  PETG:{price:3,note:'Tougher and more heat-resistant for practical parts.'},
  TPU:{price:6,note:'Flexible material for grips, feet, and parts that need give.'}
}

export const colors=['Black','White','Gray','Red','Blue','Natural']

export const products=[
{id:'dock',name:'Desk Cable Dock',price:18,tag:'Best Seller',category:'Desk & Office',description:'A clean, compact home for the cables that never stay put.',details:'A compact desktop organizer designed to keep charging and connection cables separated, accessible, and off the floor.',uses:['Charging cables','USB and power leads','Desk setups']},
{id:'stand',name:'Controller Stand',price:24,tag:'Popular',category:'Gaming',description:'Weighted, low-profile support built for everyday use.',details:'A stable display and storage stand for controllers between sessions.',uses:['Game controllers','Desk or shelf display','Gaming setups']},
{id:'hook',name:'Headphone Hook',price:16,tag:'New',category:'Desk & Office',description:'A simple under-desk mount that keeps your setup clear.',details:'An under-desk hanger that gives headphones a dedicated home.',uses:['Headphones','Headsets','Under-desk storage']},
{id:'organizer',name:'Modular Home Organizer',price:32,tag:'Popular',category:'Home',description:'Stackable storage designed around the things you actually own.',details:'A modular storage piece intended to grow with your space.',uses:['Small household items','Shelves and counters','Modular storage']},
{id:'mount',name:'Utility Mount',price:21,tag:'Made to Order',category:'Home',description:'A compact mounting solution for awkward spaces.',details:'A practical mounting platform for small equipment and accessories.',uses:['Small equipment','Accessories','Custom mounting points']},
{id:'gaming',name:'Gaming Desk Dock',price:29,tag:'New',category:'Gaming',description:'Keep controllers, cables, and accessories within reach.',details:'A dedicated landing zone for gaming accessories.',uses:['Controllers','Cables','Gaming accessories']}
]

export const categories=['All','Desk & Office','Gaming','Home']
export const getProduct=(id='dock')=>products.find(product=>product.id===id)||products[0]
