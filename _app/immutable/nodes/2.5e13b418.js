import{s as B,n as H,f as F}from"../chunks/scheduler.63274e7e.js";import{S as J,i as K,g as m,h as v,j as p,f,k as h,a as U,y as N,m as D,s as V,n as q,c as z,x as o,o as L}from"../chunks/index.51bfdc9e.js";function M(n){return(n==null?void 0:n.length)!==void 0?n:Array.from(n)}const O=""+new URL("../assets/star.84d3d315.svg",import.meta.url).href;function P(n,t,a){const e=n.slice();return e[1]=t[a].repo,e}function T(n){let t,a,e,l=n[1].name+"",r,s,g,_,x=n[1].description+"",b,w,u,d,R,E=n[1].stargazers.totalCount+"",I,C;return{c(){t=m("article"),a=m("a"),e=m("h2"),r=D(l),g=V(),_=m("div"),b=D(x),w=V(),u=m("div"),d=m("img"),I=D(E),C=V(),this.h()},l(i){t=v(i,"ARTICLE",{class:!0});var c=p(t);a=v(c,"A",{href:!0,class:!0});var S=p(a);e=v(S,"H2",{class:!0});var j=p(e);r=q(j,l),j.forEach(f),S.forEach(f),g=z(c),_=v(c,"DIV",{});var G=p(_);b=q(G,x),G.forEach(f),w=z(c),u=v(c,"DIV",{class:!0});var A=p(u);d=v(A,"IMG",{src:!0,alt:!0,class:!0}),I=q(A,E),A.forEach(f),C=z(c),c.forEach(f),this.h()},h(){h(e,"class","text-3xl font-bold"),h(a,"href",s=n[1].url),h(a,"class","hover:text-blue-600"),F(d.src,R=O)||h(d,"src",R),h(d,"alt","star"),h(d,"class","h-6"),h(u,"class","flex items-center gap-2 text-yellow-600"),h(t,"class","bg-white p-4 mx-4 rounded-xl flex flex-col gap-4")},m(i,c){U(i,t,c),o(t,a),o(a,e),o(e,r),o(t,g),o(t,_),o(_,b),o(t,w),o(t,u),o(u,d),o(u,I),o(t,C)},p(i,c){c&1&&l!==(l=i[1].name+"")&&L(r,l),c&1&&s!==(s=i[1].url)&&h(a,"href",s),c&1&&x!==(x=i[1].description+"")&&L(b,x),c&1&&E!==(E=i[1].stargazers.totalCount+"")&&L(I,E)},d(i){i&&f(t)}}}function Q(n){let t,a=M(n[0].repos),e=[];for(let l=0;l<a.length;l+=1)e[l]=T(P(n,a,l));return{c(){t=m("div");for(let l=0;l<e.length;l+=1)e[l].c();this.h()},l(l){t=v(l,"DIV",{class:!0});var r=p(t);for(let s=0;s<e.length;s+=1)e[s].l(r);r.forEach(f),this.h()},h(){h(t,"class","flex flex-col gap-4 max-w-4xl mx-auto my-8")},m(l,r){U(l,t,r);for(let s=0;s<e.length;s+=1)e[s]&&e[s].m(t,null)},p(l,[r]){if(r&1){a=M(l[0].repos);let s;for(s=0;s<a.length;s+=1){const g=P(l,a,s);e[s]?e[s].p(g,r):(e[s]=T(g),e[s].c(),e[s].m(t,null))}for(;s<e.length;s+=1)e[s].d(1);e.length=a.length}},i:H,o:H,d(l){l&&f(t),N(e,l)}}}function W(n,t,a){let{data:e}=t;return n.$$set=l=>{"data"in l&&a(0,e=l.data)},[e]}class Z extends J{constructor(t){super(),K(this,t,W,Q,B,{data:0})}}export{Z as component};
