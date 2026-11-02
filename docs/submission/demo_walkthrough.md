# Demo Walkthrough — Same River Twice

> প্রতিটা ফিচার ক্রমানুসারে দেখানোর জন্য একটা সম্পূর্ণ চেকলিস্ট। প্রতিটা ধাপে: কী ক্লিক করবেন, কী দেখাবেন, কী বলবেন।
> চেকবক্স `[ ]` টিক দিয়ে রিহার্সালের সময় ট্র্যাক রাখুন।

---

## ধাপ ০ — প্রস্তুতি
- [ ] ব্রাউজারে `http://localhost:5173/` খুলুন (অথবা deploy হওয়া URL)
- [ ] একটা privacy/incognito window ব্যবহার করুন, যাতে localStorage-এর পুরনো Field-note না দেখায়
- [ ] Zoom level normal রাখুন (ছবি/টেক্সট স্পষ্ট দেখানোর জন্য)

---

## ধাপ ১ — Homepage (`/`)
- [ ] Hero section দেখান: **"Prove the river moved. Don't just claim it."**
- [ ] ৪টা ফিচার কার্ড স্ক্রল করে দেখান: Real NISAR radar / Before-after compare / Evidence-linked claims / Honest by design
- [ ] ব্যাকগ্রাউন্ডে আসল রাডার ছবি (faded) খেয়াল করান
- **বলুন:** *"এটা NASA-র NISAR স্যাটেলাইট রাডার দিয়ে যমুনা নদীর ভাঙন-অনুসন্ধান করা একটা প্ল্যাটফর্ম — শুরু থেকেই এটা 'সত্যি প্রমাণ করা'-র ওপর জোর দেয়, শুধু দাবি করার ওপর না।"*

## ধাপ ২ — Sign in (`/auth`)
- [ ] উপরের ডানপাশের **"Sign in"** ক্লিক করুন
- [ ] "Continue with Google" বাটন আর email/password ফর্ম দেখান (ডিজাইন হিসেবে)
- [ ] যেকোনো কিছু লিখে "Sign in" চাপুন (নিচে লেখা আছে "Demo only")
- **বলুন:** *"এটা demo-login — সত্যিকারের ব্যাকএন্ড নেই, কিন্তু একটা সম্পূর্ণ প্রোডাক্টের entry-flow দেখানোর জন্য যোগ করা হয়েছে।"*

## ধাপ ৩ — Case Library (`/cases`)
- [ ] দুটো investigation card দেখান
- [ ] verdict রং খেয়াল করান: **INCONCLUSIVE** (লাল বর্ডার) বনাম **LIMITED** (হলুদ বর্ডার)
- [ ] প্রতিটা কার্ডে reach_id, bbox কোঅর্ডিনেট, processed তারিখ দেখান
- **বলুন:** *"প্রতিটা case-এর পেছনে একটা সম্পূর্ণ প্রসেস করা real satellite bundle আছে, বানানো ডেটা না।"*
- [ ] **"Jamuna — Chilmari–Roumari Reach"** কার্ডে ক্লিক করুন

## ধাপ ৪ — মূল Investigation ভিউ (`/app`)
- [ ] TopBar-এ **"← all investigations"** লিংক খেয়াল করান (ফিরে যাওয়ার পথ)
- [ ] reach dropdown দেখান (একাধিক reach থাকলে বদলানো যায়)
- [ ] "NISAR data through 20260919 · processed ..." — ডেটা-তাজা থাকার তথ্য দেখান
- [ ] ম্যাপে **আসল রাডার ছবি** (braided channel network) দেখান
- [ ] বামপাশে headline সংখ্যা **"3,622.64 ha — Land lost to the river"** দেখান
- [ ] **INCONCLUSIVE** ব্যাজ স্পষ্টভাবে দেখান
- **বলুন (গুরুত্বপূর্ণ):** *"সংখ্যাটা এখনো নিশ্চিত/বিশ্বাসযোগ্য না — সিস্টেম নিজেই সেটা honestly বলে দিচ্ছে, লুকাচ্ছে না বা ভুয়া নিশ্চয়তা দিচ্ছে না। এটাই এই প্রজেক্টের মূল দর্শন।"*

## ধাপ ৫ — Map Layers
- [ ] **"Water"** বাটনে ক্লিক করুন → cyan/নীল overlay দেখান নদীর ওপর
- [ ] বাটনের ✓ চেকমার্ক আর নীল হাইলাইট খেয়াল করান (active state স্পষ্ট বোঝা যায়)
- [ ] **"Match the water"** বাটনে ক্লিক করুন → ম্যাপ দুই ভাগে split হয়ে যাবে
- [ ] উপরে **"Before: 20260826"** / **"After: 20260919"** লেবেল দেখান
- [ ] মাঝের স্লাইডার ধরে ড্র্যাগ করে দুই তারিখের ছবি compare করুন
- [ ] **Erosion** (কমলা) আর **Accretion** (হলুদ) overlay দেখান — নদীর কিনারা ঘেঁষে কেন্দ্রীভূত প্যাটার্ন খেয়াল করান
- **বলুন:** *"কমলা/হলুদ দাগগুলো ঠিক সেই জায়গা যেখানে দুই তারিখের মধ্যে পানি/জমি বদলেছে — অ্যালগরিদম নিজে খুঁজে বের করেছে, চোখে খুঁজতে হয়নি।"*

## ধাপ ৬ — নিচের Timeline
- [ ] **"Showing: [Aug 26] [✓ Sep 19]"** বাটন দুটো দেখান
- [ ] Aug 26-এ ক্লিক করে দেখান ম্যাপের ছবি বদলে যায় (single-date browse mode-এ, compare থেকে বের হয়ে)
- **বলুন:** *"শুধু ২টা real satellite pass আছে এই মুহূর্তে — তাই মাত্র ২টা বাটন।"*

## ধাপ ৭ — Evidence Drawer (৫টা ধাপ, সবচেয়ে গুরুত্বপূর্ণ অংশ)
- [ ] "Match the water" থেকে বেরিয়ে (Exit Compare) সাধারণ ভিউতে ফিরুন
- [ ] **"Start the investigation →"** বাটনে ক্লিক করুন (Evidence সেকশনের নিচে)
- [ ] ডানপাশে drawer slide করে খুলবে, উপরে **"1/5"** progress দেখান

### 7.1 Detect
- [ ] Threshold shift (0.54 dB), Changed area (61.3 km²), Reach extent, Noise floor ("not evaluated") দেখান
- **বলুন:** *"যেখানে real ডেটা নেই (noise floor), honestly 'not evaluated' লেখা — বানানো সংখ্যা না।"*
- [ ] **"Investigate →"** চাপুন

### 7.2 Investigate
- [ ] NISAR (Supports), OPERA DSWx-S1 (Not available), River stage (Warning) দেখান
- [ ] **Rainfall anomaly, GPM IMERG: "1.72x seasonal norm — Supports"** — এটা real NASA বৃষ্টিপাত ডেটা, বিশেষভাবে দেখান
- **বলুন:** *"এই বৃষ্টিপাতের সংখ্যাটা সত্যিকারের NASA GPM স্যাটেলাইট ডেটা থেকে আনা, বানানো না।"*
- [ ] Vegetation response ("Not available") দেখান
- [ ] **"Challenge →"** চাপুন

### 7.3 Challenge
- [ ] Signal above noise, Scene alignment (Not run) দেখান
- [ ] Threshold sensitivity (185.4%, Warning) দেখান
- [ ] RFI/interference (Warning) দেখান
- [ ] **Order-of-magnitude plausibility: "FAILS"** — লাল রঙে স্পষ্ট দেখান
- **বলুন (গুরুত্বপূর্ণ):** *"এই একটা চেক সত্যিই ব্যর্থ হয়েছে — এটাই একমাত্র কারণ কেন পুরো ফলাফলটা INCONCLUSIVE। এটা UI-তে বানানো কিছু না, real হিসাব থেকে এসেছে।"*
- [ ] **"Explain →"** চাপুন

### 7.4 Explain
- [ ] Plain-language অনুচ্ছেদ দেখান (তারিখ, সংখ্যা, verdict কারণ সহ)
- [ ] নিচের নোট দেখান: *"Fixed template... never phrased by a language model"*
- **বলুন:** *"এটা AI/LLM লেখেনি — একটা নির্দিষ্ট টেমপ্লেটে real সংখ্যা বসিয়ে বানানো, তাই কখনো ভুল তথ্য দেবে না।"*
- [ ] **"Field →"** চাপুন

### 7.5 Field (Scan / Verify / Feel)
- [ ] **Scan:** "check my location" বাটনে ক্লিক করুন → real GPS দিয়ে "Inside/Outside the investigation footprint" দেখান
- [ ] **Verify:** টেক্সটবক্সে একটা কথা লিখে "Log observation" চাপুন → নোট সেভ হওয়া দেখান
- **বলুন:** *"এই নোট শুধু আপনার ব্রাউজারে থাকে, কোথাও পাঠানো হয় না — স্পষ্ট লেখা আছে।"*
- [ ] **Feel:** "▶ play" বাটনে ক্লিক করুন → dB মান থেকে বানানো audio pulse শোনান
- **বলুন:** *"এই শব্দটা real threshold মান (-15.1dB) থেকে গাণিতিকভাবে বানানো, রেকর্ড করা কোনো 'NASA sound' না।"*
- [ ] "Done" চাপুন, drawer বন্ধ করুন

## ধাপ ৮ — Provenance (polygon click)
- [ ] ম্যাপে scroll করে zoom in করুন কোনো কমলা/হলুদ দাগের কাছে
- [ ] দাগের ওপর সরাসরি ক্লিক করুন → ডানপাশে Evidence Panel খুলবে
- [ ] দেখান: What (area), Where, When (t0/t1), Radar (before/after thumbnail), **Sources** (real granule ID + date), Method (threshold params), Checks
- **বলুন:** *"যেকোনো দাগে ক্লিক করলেই সরাসরি satellite granule ID পর্যন্ত ট্রেস করা যায় — ২ ক্লিকে।"*

## ধাপ ৯ — 3D Relief
- [ ] উপরে-ডানে **"3D relief"** বাটনে ক্লিক করুন
- [ ] ম্যাপ tilt হয়ে যাওয়া দেখান
- **বলুন:** *"এটা শুধু presentation layer, বৈজ্ঞানিক পরিমাপ না — বাটনের tooltip-এও সেটা লেখা আছে।"* (যমুনা সমতল এলাকা বলে বড় উচ্চতা-পার্থক্য দেখাবে না, এটাই বাস্তবতা)

## ধাপ ১০ — SAR Lab (`/sar-lab`)
- [ ] শুরুতে NISAR mission facts ও band selector দেখান; বলুন wavelength interaction বদলায়, কিন্তু penetration depth স্থির সংখ্যা নয়
- [ ] **Flood Signal Mechanism Simulator**-এ open floodplain, crops, woody vegetation বদলান এবং standing-water toggle দেখান
- **বলুন:** *"এটা backscatter prediction নয়—কোন scattering path flood-এর সময় signal বাড়াতে বা কমাতে পারে, তার schematic।"*
- [ ] **Radar Geometry Cross-Section**-এ incidence angle বদলে layover, foreshortening ও shadow দেখান
- [ ] **SweepSAR**-এ Traditional Stripmap ও SweepSAR + DBF তুলনা করুন
- [ ] **Dielectric Interface: Fresnel Reflectance**-এ angle slider সরান; incident/reflected/transmitted ray ও H/V reflectance একই সঙ্গে আপডেট দেখান
- **বলুন:** *"এটি flat, lossless interface-এর Fresnel reflectance—SAR backscatter বা বাস্তব surface return নয়।"*
- [ ] **L-/S-band Target-Scale Simulator**-এ target diameter বদলে `x = πd/λ` কীভাবে বদলায় দেখান
- [ ] **Speckle Lab**, **H/α Synthetic Lab**, **Temporal Coherence Model**, **Threshold Sensitivity**, ও **InSAR Fringe Synthesizer**-এ synthetic/parameterized inputs-এর label দেখান
- **বলুন:** *"এই panels শেখার জন্য synthetic বা idealized; এগুলো Jamuna data-তে H/α, coherence, বা deformation হিসাব করেছে—এমন দাবি নয়।"*
- [ ] **Change Detection Explorer**-এ quicklook swipe এবং map scan চালান; manifest থেকে আসা area এবং **INCONCLUSIVE** verdict দেখান
- **বলুন:** *"Quicklook cutoff production classifier নয়; mapped change-ও confirmed erosion নয়। বর্তমান result inconclusive।"*
- [ ] **Water and Change Map Lens** এবং **Water Classification Pipeline** দেখান; lens-এর mask-কে Pauli decomposition বলবেন না
- **বলুন:** *"SAR Lab-এর পুরো panel ও সীমাবদ্ধতা docs/SAR_LAB.md-এ লেখা আছে।"*

## ধাপ ১১ — Methods পেজ (`/methods`)
- [ ] TopBar/Landing থেকে "Methods" লিংকে ক্লিক করুন
- [ ] Pipeline-এর ১২টা ধাপ (DISCOVER → ... → CHECK BUNDLE) দেখান
- [ ] Data sources টেবিল দেখান (NISAR, DSWx-S1, HAND, JRC GSW, FFWC)
- [ ] "What we don't claim" আর "Limitations" সেকশন দেখান
- [ ] "Reproduce this" কোড ব্লক দেখান
- **বলুন:** *"এই পেজেই সব সীমাবদ্ধতা খোলাখুলি লেখা আছে — কিছু লুকানো হয়নি।"*

## ধাপ ১২ — PWA (ঐচ্ছিক, সময় থাকলে)
- [ ] ব্রাউজারের address bar-এ "Install" আইকন দেখান (Chrome desktop) অথবা মোবাইলে "Add to Home Screen"
- **বলুন:** *"এটা মোবাইল/ডেস্কটপে একটা installable app হিসেবে ব্যবহার করা যায়।"*

---

## যা যা এখনো honestly অসম্পূর্ণ (judge জিজ্ঞেস করলে বলার জন্য)
- মূল সংখ্যা (৩,৬২২ ha) এখনো plausibility-check-এ fail করছে — আরও satellite pass (কমপক্ষে ৩টা, একটা flood-peak-এর আগে-পরে) লাগবে নিশ্চিত হতে
- MODIS vegetation/NDVI ক্রস-চেক এখনো real ডেটা দিয়ে wire করা হয়নি
- Live backend/API নেই — এটা ইচ্ছাকৃত সিদ্ধান্ত (static bundle বেশি নির্ভরযোগ্য একটা মাত্র case-এর জন্য)
- Field-এর ছবি/নোট আপলোড হয় না, শুধু লোকাল ডিভাইসে থাকে

## দ্রুত সংস্করণ (৩০ সেকেন্ডের ভিডিওর জন্য)
ধাপ ৩ (cases) → ধাপ ৪ (real ছবি + INCONCLUSIVE) → ধাপ ৭.৩ (Challenge-এর plausibility FAIL) → ধাপ ৮ (provenance click) — এই ৪টাই যথেষ্ট মূল গল্প বলতে।
