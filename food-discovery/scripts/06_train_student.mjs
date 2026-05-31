// 06 — ML student training PROOF (distillation loop, dependency-free).
// Trains a multinomial Naive Bayes text classifier to predict `overall`
// sentiment from review text, using the LLM teacher's labels as ground truth.
// Holds out 20% for eval; reports accuracy vs. a majority-class baseline.
//
// This proves the mechanics: teacher labels -> a trainable model that
// generalizes to unseen reviews. (Real student = transformer on ~10k; same loop.)
//
// In:  data/work/reviews.jsonl (text), data/work/labels.jsonl (labels)
// Out: out/student_metrics.json, out/student_model.json
import fs from "fs";

const REVIEWS = "food-discovery/data/work/reviews.jsonl";
const LABELS = "food-discovery/data/work/labels.jsonl";
const OUT_METRICS = "food-discovery/out/student_metrics.json";
const OUT_MODEL = "food-discovery/out/student_model.json";

const textById = {};
for(const l of fs.readFileSync(REVIEWS,"utf8").trim().split("\n").filter(Boolean)){ const r=JSON.parse(l); textById[r.review_id]=r.text; }
const data=[];
for(const l of fs.readFileSync(LABELS,"utf8").trim().split("\n").filter(Boolean)){
  const lab=JSON.parse(l); const text=textById[lab.review_id];
  if(text && lab.overall) data.push({text, label:lab.overall});
}

function tok(s){ return s.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>2); }

// seeded shuffle (deterministic)
let seed=42; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
data.sort(()=>rnd()-0.5);
const split=Math.floor(data.length*0.8);
const train=data.slice(0,split), test=data.slice(split);

// train multinomial NB
const classes=[...new Set(data.map(d=>d.label))];
const classCount={}, wordCount={}, classTotal={}, vocab=new Set();
for(const c of classes){ classCount[c]=0; wordCount[c]={}; classTotal[c]=0; }
for(const d of train){
  classCount[d.label]++;
  for(const w of tok(d.text)){ vocab.add(w); wordCount[d.label][w]=(wordCount[d.label][w]||0)+1; classTotal[d.label]++; }
}
const V=vocab.size;
function predict(text){
  let best=null,bestLp=-Infinity;
  for(const c of classes){
    let lp=Math.log((classCount[c]+1)/(train.length+classes.length));
    for(const w of tok(text)) lp += Math.log(((wordCount[c][w]||0)+1)/(classTotal[c]+V));
    if(lp>bestLp){ bestLp=lp; best=c; }
  }
  return best;
}

// eval
let correct=0; const cm={};
for(const c of classes){ cm[c]={}; for(const c2 of classes) cm[c][c2]=0; }
for(const d of test){ const p=predict(d.text); cm[d.label][p]++; if(p===d.label) correct++; }
const acc = test.length ? correct/test.length : 0;

// majority baseline
const maj=Object.entries(classCount).sort((a,b)=>b[1]-a[1])[0][0];
const majAcc = test.length ? test.filter(d=>d.label===maj).length/test.length : 0;

// per-class F1
const f1={};
for(const c of classes){
  const tp=cm[c][c]; let fp=0,fn=0;
  for(const c2 of classes){ if(c2!==c){ fp+=cm[c2][c]; fn+=cm[c][c2]; } }
  const prec=tp/(tp+fp||1), rec=tp/(tp+fn||1);
  f1[c]=+( (2*prec*rec)/((prec+rec)||1) ).toFixed(3);
}

const metrics={ examples:data.length, train:train.length, test:test.length, classes,
  class_distribution:classCount, accuracy:+acc.toFixed(3), majority_baseline:+majAcc.toFixed(3),
  lift_over_baseline:+(acc-majAcc).toFixed(3), per_class_f1:f1, confusion_matrix:cm, vocab_size:V };
fs.writeFileSync(OUT_METRICS, JSON.stringify(metrics,null,1));
fs.writeFileSync(OUT_MODEL, JSON.stringify({classes,classCount,classTotal,wordCount,V,train_n:train.length},null,0));

console.log("=== train_student (distillation proof) ===");
console.log(`examples=${data.length} train=${train.length} test=${test.length} classes=${classes.join(",")}`);
console.log(`class dist:`, classCount);
console.log(`ACCURACY=${(acc*100).toFixed(1)}%  vs majority baseline ${(majAcc*100).toFixed(1)}%  (lift +${((acc-majAcc)*100).toFixed(1)}pp)`);
console.log(`per-class F1:`, f1);
