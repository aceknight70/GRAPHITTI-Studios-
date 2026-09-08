const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const navOld = `<nav class="bg-white border-b shadow-sm sticky top-0 z-20">
    <div class="max-w-5xl mx-auto px-4 flex justify-center gap-6 overflow-x-auto py-3 text-sm font-bold uppercase text-gray-600 scrollbar-hide">
      <button onclick="showRoom('room-landing')" class="hover:text-gsGold whitespace-nowrap">Home</button>
      <button onclick="showRoom('room-marketplace')" class="hover:text-gsGold whitespace-nowrap">Marketplace</button>
      <button onclick="showRoom('room-apply')" class="hover:text-gsGold whitespace-nowrap">School Apply</button>
      <button onclick="showRoom('room-institute-apply')" class="hover:text-gsGold whitespace-nowrap">Institute Apply</button>
      <button onclick="showRoom('room-connector-signup')" class="hover:text-gsGold whitespace-nowrap">Connectors</button>
    </div>
  </nav>`;

const navNew = `<nav class="bg-white border-b shadow-sm sticky top-0 z-20">
    <div class="max-w-5xl mx-auto px-4 flex justify-start md:justify-center gap-6 overflow-x-auto py-3 text-sm font-bold uppercase text-gray-600 scrollbar-hide">
      <button onclick="showRoom('room-landing')" class="hover:text-gsGold whitespace-nowrap">Home</button>
      <button onclick="showRoom('room-about')" class="hover:text-gsGold whitespace-nowrap">About Us</button>
      <button onclick="showRoom('room-programs')" class="hover:text-gsGold whitespace-nowrap">Programs</button>
      <button onclick="showRoom('room-apply-hub')" class="hover:text-gsGold whitespace-nowrap">Apply</button>
      <button onclick="showRoom('room-fees')" class="hover:text-gsGold whitespace-nowrap">Fees</button>
      <button onclick="showRoom('room-marketplace')" class="hover:text-gsGold whitespace-nowrap">Marketplace</button>
      <button onclick="showRoom('room-team')" class="hover:text-gsGold whitespace-nowrap">Team & Partners</button>
      <button onclick="showRoom('room-alumni')" class="hover:text-gsGold whitespace-nowrap">Alumni</button>
      <button onclick="showRoom('room-channels')" class="hover:text-gsGold whitespace-nowrap">Channels</button>
      <button onclick="showRoom('room-connector-signup')" class="hover:text-gsGold whitespace-nowrap">Connectors</button>
    </div>
  </nav>`;

html = html.replace(navOld, navNew);

const landingStart = `<!-- ROOM: LANDING -->`;
const applyStart = `<!-- ROOM: APPLY (School) -->`;

const newRooms = `<!-- ROOM: LANDING -->
    <div id="room-landing" class="room active flex flex-col items-center justify-center space-y-8 py-12">
      <h2 class="text-5xl font-display uppercase tracking-tight text-center max-w-4xl leading-tight">Empowering the Next Generation of Creative Entrepreneurs</h2>
      <p class="text-xl text-gray-600 text-center max-w-2xl">From school-packaged SDG tracks to full commercial production depth, we provide the skills, platform, and marketplace to turn creativity into sustainable enterprise.</p>
      <div class="flex gap-4 mt-8">
         <button onclick="showRoom('room-apply-hub')" class="btn-primary text-lg px-8 py-4">Start Your Journey</button>
         <button onclick="showRoom('room-programs')" class="btn-secondary text-lg px-8 py-4">View Programs</button>
      </div>
    </div>

    <!-- ROOM: ABOUT US & LOCATION -->
    <div id="room-about" class="room space-y-12">
       <div class="text-center max-w-3xl mx-auto mt-8">
         <h2 class="text-4xl font-display uppercase tracking-tight mb-4">About Us</h2>
         <p class="text-gray-600 leading-relaxed text-lg">Graphitti Studios is a premier Creative Entrepreneurship Incubator. We bridge the gap between creative passion and market reality, equipping individuals and institutions with the production mechanics and business acumen required to thrive in the modern economy.</p>
       </div>
       <div class="card max-w-3xl mx-auto border-t-4 border-gsBrown bg-orange-50 text-center">
         <h3 class="text-2xl font-display uppercase mb-4 text-gsBrown">Address & Location</h3>
         <p class="font-bold text-lg mb-1">Graphitti Studios Headquarters</p>
         <p class="text-gray-700">12 Creative Hub Avenue, Tech District</p>
         <p class="text-gray-700">Lagos, Nigeria</p>
         <div class="mt-6 p-12 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 italic">
           [ Interactive Map / Studio Photo Placeholder ]
         </div>
       </div>
    </div>

    <!-- ROOM: PROGRAMS -->
    <div id="room-programs" class="room space-y-8">
      <div class="text-center max-w-3xl mx-auto mt-8 mb-8">
        <h2 class="text-4xl font-display uppercase tracking-tight">Our Programmes</h2>
        <p class="text-gray-600 leading-relaxed text-lg">Whether you're a school student building a startup, an adult looking for a freelance career, or a creative launching a commercial enterprise, we have a track for you.</p>
      </div>
      <!-- Cards Container -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="programmes-grid">
        <div class="card fly-in flex flex-col hover:shadow-lg transition-shadow border-t-4 border-gsGold">
           <h4 class="font-display text-xl uppercase mb-2">Shadow SDG Entrepreneurship</h4>
           <div class="flex gap-2 mb-3">
             <span class="badge bg-green-100 text-green-800">School-Packaged ✓</span>
             <span class="badge bg-blue-100 text-blue-800">Institute</span>
           </div>
           <p class="text-gray-600 text-sm mb-4 flex-grow">Building a business around a UN SDG (4, 8, 9, 12). Flagship skill: Resin Jewellery. 6-week structure ending in a Market Day.</p>
           <button class="btn-primary w-full" onclick="showRoom('room-apply')">Apply (School)</button>
        </div>
        <div class="card fly-in flex flex-col hover:shadow-lg transition-shadow border-t-4 border-gsRed" style="transition-delay: 100ms;">
           <h4 class="font-display text-xl uppercase mb-2">Commercial Creative</h4>
           <div class="flex gap-2 mb-3">
             <span class="badge bg-green-100 text-green-800">School-Packaged ✓</span>
             <span class="badge bg-blue-100 text-blue-800">Institute</span>
           </div>
           <p class="text-gray-600 text-sm mb-4 flex-grow">Market-driven art, fashion, graphic design sold purely to a willing market. Pure profit and production mechanics.</p>
           <button class="btn-primary w-full bg-gsRed hover:bg-red-600" onclick="showRoom('room-apply')">Apply (School)</button>
        </div>
        <div class="card fly-in flex flex-col hover:shadow-lg transition-shadow border-t-4 border-gsBlue" style="transition-delay: 200ms;">
           <h4 class="font-display text-xl uppercase mb-2">Digital & Tech-Creative</h4>
           <div class="flex gap-2 mb-3">
             <span class="badge bg-green-100 text-green-800">School-Packaged ✓</span>
             <span class="badge bg-blue-100 text-blue-800">Institute</span>
           </div>
           <p class="text-gray-600 text-sm mb-4 flex-grow">Content creation, digital marketing, digital assets. Minimal physical cost, max exposure.</p>
           <button class="btn-primary w-full bg-gsBlue hover:bg-blue-600" onclick="showRoom('room-apply')">Apply (School)</button>
        </div>
        <div class="card fly-in flex flex-col hover:shadow-lg transition-shadow border-t-4 border-gsBrown" style="transition-delay: 300ms;">
           <h4 class="font-display text-xl uppercase mb-2">Cultural & Heritage</h4>
           <div class="flex gap-2 mb-3">
             <span class="badge bg-purple-100 text-purple-800">Institute Only</span>
           </div>
           <p class="text-gray-600 text-sm mb-4 flex-grow">Indigenous stories, traditional art, textiles, Nollywood-adjacent storytelling. Full production-house depth.</p>
           <button class="btn-secondary w-full" onclick="showRoom('room-institute-apply')">Apply (Institute)</button>
        </div>
        <div class="card fly-in flex flex-col hover:shadow-lg transition-shadow border-t-4 border-gsGreen" style="transition-delay: 400ms;">
           <h4 class="font-display text-xl uppercase mb-2">Freelance / Portfolio</h4>
           <div class="flex gap-2 mb-3">
             <span class="badge bg-purple-100 text-purple-800">Institute Only</span>
           </div>
           <p class="text-gray-600 text-sm mb-4 flex-grow">Gig-economy portfolio for cinematographers, MUAs, set designers. Master client management and contracts.</p>
           <button class="btn-secondary w-full border-gsGreen text-gsGreen hover:bg-green-50" onclick="showRoom('room-institute-apply')">Apply (Institute)</button>
        </div>
      </div>
    </div>

    <!-- ROOM: FEES / PAYMENTS -->
    <div id="room-fees" class="room max-w-4xl mx-auto space-y-8 mt-8">
       <h2 class="text-4xl font-display uppercase tracking-tight text-center mb-8">Fees & Payments</h2>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card border-t-4 border-gsGold">
             <h3 class="font-bold text-xl uppercase mb-2">School-Packaged Programs</h3>
             <p class="text-gray-600 text-sm mb-4">Paid directly to the participating school as part of term extensions or holiday bootcamps. Contact your school administrator for exact pricing.</p>
          </div>
          <div class="card border-t-4 border-gsBrown">
             <h3 class="font-bold text-xl uppercase mb-2">Institute Programs</h3>
             <p class="text-gray-600 text-sm mb-2">Mini (Short Course): ₦50,000</p>
             <p class="text-gray-600 text-sm mb-4">Deep (Full Certification): ₦150,000</p>
          </div>
       </div>
       <div class="card bg-green-50 border-l-4 border-green-600 text-center">
          <h3 class="font-bold text-xl uppercase mb-2 text-green-800">Payment Instructions</h3>
          <p class="text-sm text-gray-700 mb-2">Please make all direct transfers to our official corporate account:</p>
          <div class="p-6 bg-white rounded border mt-3 font-mono text-lg inline-block text-left">
             <p class="mb-1">Bank: <span class="font-bold text-gray-900">Guaranty Trust Bank (GTB)</span></p>
             <p class="mb-1">Account Name: <span class="font-bold text-gray-900">Graphitti Studios</span></p>
             <p>Account Number: <span class="font-bold text-gray-900">0123456789</span></p>
          </div>
          <p class="text-xs text-gray-500 mt-4 italic">After payment, upload your receipt during the application process or send via our official WhatsApp channel.</p>
       </div>
    </div>

    <!-- ROOM: TEAM & PARTNERS -->
    <div id="room-team" class="room space-y-12 mt-8">
       <div class="text-center max-w-3xl mx-auto">
         <h2 class="text-4xl font-display uppercase tracking-tight mb-2">Our Team & Partners</h2>
         <p class="text-gray-600">The industry veterans and institutional partners powering Graphitti Studios.</p>
       </div>
       
       <div>
         <h3 class="text-2xl font-display uppercase mb-6 text-center border-b pb-2">Leadership & Instructors</h3>
         <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
           <div class="card text-center p-4 hover:shadow-lg transition">
             <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3"></div>
             <h4 class="font-bold uppercase text-sm">Lead Director</h4>
             <p class="text-xs text-gray-500">Creative Strategist</p>
           </div>
           <div class="card text-center p-4 hover:shadow-lg transition">
             <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3"></div>
             <h4 class="font-bold uppercase text-sm">Head of Tech</h4>
             <p class="text-xs text-gray-500">Digital & Tech Track</p>
           </div>
           <div class="card text-center p-4 hover:shadow-lg transition">
             <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3"></div>
             <h4 class="font-bold uppercase text-sm">Master Craftsman</h4>
             <p class="text-xs text-gray-500">Resin & Production</p>
           </div>
           <div class="card text-center p-4 hover:shadow-lg transition">
             <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3"></div>
             <h4 class="font-bold uppercase text-sm">Culture Lead</h4>
             <p class="text-xs text-gray-500">Heritage Track</p>
           </div>
         </div>
       </div>

       <div>
         <h3 class="text-2xl font-display uppercase mb-6 text-center border-b pb-2">Institutional Partners</h3>
         <div class="flex flex-wrap justify-center gap-8 items-center opacity-70">
            <div class="font-display text-2xl">ESGMC</div>
            <div class="font-display text-2xl">Timothy School</div>
            <div class="font-display text-2xl">NYSC</div>
            <div class="font-display text-2xl">Nollywood Hub</div>
         </div>
       </div>
    </div>

    <!-- ROOM: ALUMNI NETWORK -->
    <div id="room-alumni" class="room space-y-8 mt-8">
       <div class="text-center max-w-3xl mx-auto">
         <h2 class="text-4xl font-display uppercase tracking-tight mb-2">Alumni Network</h2>
         <p class="text-gray-600">Celebrating the creatives who have launched successful enterprises through Graphitti.</p>
       </div>
       <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card border-t-4 border-gsGold">
             <h4 class="font-bold uppercase text-lg mb-1">Resin Arts Enterprise</h4>
             <p class="text-xs text-gsGold font-bold mb-2">Shadow SDG Cohort</p>
             <p class="text-sm text-gray-600 italic">"Graphitti gave me the platform to turn my passion for jewelry into a profitable business that tackles recycling."</p>
          </div>
          <div class="card border-t-4 border-gsBlue">
             <h4 class="font-bold uppercase text-lg mb-1">TechTribe Media</h4>
             <p class="text-xs text-gsBlue font-bold mb-2">Digital & Tech Track</p>
             <p class="text-sm text-gray-600 italic">"From a trainee to running my own independent digital agency managing major clients in Lagos."</p>
          </div>
          <div class="card border-t-4 border-gsBrown">
             <h4 class="font-bold uppercase text-lg mb-1">Heritage Threads</h4>
             <p class="text-xs text-gsBrown font-bold mb-2">Cultural & Heritage</p>
             <p class="text-sm text-gray-600 italic">"Our textile designs are now featured in three Nollywood productions thanks to the Institute's network."</p>
          </div>
       </div>
    </div>

    <!-- ROOM: CHANNELS -->
    <div id="room-channels" class="room max-w-2xl mx-auto space-y-6 mt-8">
       <div class="text-center mb-6">
         <h2 class="text-4xl font-display uppercase tracking-tight mb-2">Our Channels</h2>
         <p class="text-gray-600">Join the community and stay updated with Graphitti Studios.</p>
       </div>
       <div class="card flex items-center justify-between hover:shadow-lg transition">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-2xl">💬</div>
             <div>
                <h3 class="font-bold text-lg uppercase">WhatsApp Community</h3>
                <p class="text-sm text-gray-500">Join our vibrant creative discussions.</p>
             </div>
          </div>
          <button class="btn-primary bg-green-500 hover:bg-green-600 text-xs">Join Now</button>
       </div>
       <div class="card flex items-center justify-between hover:shadow-lg transition">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-pink-500 rounded flex items-center justify-center text-white text-2xl">📸</div>
             <div>
                <h3 class="font-bold text-lg uppercase">Instagram</h3>
                <p class="text-sm text-gray-500">See behind-the-scenes production.</p>
             </div>
          </div>
          <button class="btn-primary bg-pink-500 hover:bg-pink-600 text-xs">Follow Us</button>
       </div>
       <div class="card flex items-center justify-between hover:shadow-lg transition">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white text-2xl">📘</div>
             <div>
                <h3 class="font-bold text-lg uppercase">Facebook Page</h3>
                <p class="text-sm text-gray-500">Updates, events, and market days.</p>
             </div>
          </div>
          <button class="btn-primary bg-blue-600 hover:bg-blue-700 text-xs">Like Page</button>
       </div>
    </div>

    <!-- ROOM: APPLY HUB -->
    <div id="room-apply-hub" class="room max-w-4xl mx-auto mt-8">
       <div class="text-center mb-8">
         <h2 class="text-4xl font-display uppercase tracking-tight">Apply to Graphitti Studios</h2>
         <p class="text-gray-600 mt-2">Select the path that describes you.</p>
       </div>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card 1 -->
          <div class="card border-t-4 border-gsGold hover:shadow-lg cursor-pointer transition flex flex-col" onclick="showRoom('room-apply')">
             <h3 class="font-bold text-xl uppercase mb-2">School Student</h3>
             <p class="text-sm text-gray-600 mb-4 flex-grow">For students currently enrolled in a partner school participating in a term extension program.</p>
             <button class="btn-primary w-full text-xs">Apply Here</button>
          </div>
          <!-- Card 2 -->
          <div class="card border-t-4 border-gsBrown hover:shadow-lg cursor-pointer transition flex flex-col" onclick="showRoom('room-institute-apply')">
             <h3 class="font-bold text-xl uppercase mb-2">Individual / Institute</h3>
             <p class="text-sm text-gray-600 mb-4 flex-grow">For adults, undergrads, and independent creatives applying directly to Graphitti Institute.</p>
             <button class="btn-primary bg-gsBrown hover:bg-orange-800 w-full text-xs">Apply Here</button>
          </div>
          <!-- Card 3 -->
          <div class="card border-t-4 border-gsBlue hover:shadow-lg cursor-pointer transition flex flex-col" onclick="showRoom('room-org-apply')">
             <h3 class="font-bold text-xl uppercase mb-2">School / Organization</h3>
             <p class="text-sm text-gray-600 mb-4 flex-grow">Bring Graphitti into your institution, company, or NGO.</p>
             <button class="btn-primary bg-gsBlue hover:bg-blue-600 w-full text-xs">Partner With Us</button>
          </div>
          <!-- Card 4 -->
          <div class="card border-t-4 border-gsGreen hover:shadow-lg cursor-pointer transition flex flex-col" onclick="showRoom('room-bootcamp-apply')">
             <h3 class="font-bold text-xl uppercase mb-2">Holiday Bootcamp</h3>
             <p class="text-sm text-gray-600 mb-4 flex-grow">For children participating in school holiday programs or independent bootcamps.</p>
             <button class="btn-primary bg-gsGreen hover:bg-green-600 w-full text-xs">Register Child</button>
          </div>
       </div>
    </div>

    <!-- ROOM: ORGANIZATION APPLY -->
    <div id="room-org-apply" class="room max-w-xl mx-auto mt-8">
       <button onclick="showRoom('room-apply-hub')" class="text-gsBlue font-bold text-sm uppercase mb-4 hover:underline">← Back to Apply Hub</button>
       <div class="card border-t-4 border-gsBlue">
          <h2 class="text-2xl font-display uppercase mb-2">Organization Application</h2>
          <p class="text-sm text-gray-500 mb-6">Partner with us to run Graphitti programs at your location.</p>
          <form id="org-apply-form" class="space-y-4">
             <div>
                <label class="block text-sm font-bold mb-1">Organization Type</label>
                <select name="org_type" id="org_type_select" class="input-field" onchange="document.getElementById('org-booklet-type').textContent = this.value.toUpperCase()">
                   <option value="school">School</option>
                   <option value="company">Company</option>
                   <option value="ngo">NGO</option>
                   <option value="other">Other</option>
                </select>
             </div>
             <div class="flex items-center gap-4 mb-4">
                <label class="flex items-center gap-1 text-sm font-bold cursor-pointer"><input type="radio" name="status" value="new" checked class="accent-gsBlue w-4 h-4"> New Partnership</label>
                <label class="flex items-center gap-1 text-sm font-bold cursor-pointer"><input type="radio" name="status" value="registered" class="accent-gsBlue w-4 h-4"> Already Registered</label>
             </div>
             <div><label class="block text-sm font-bold mb-1">Organization Name</label><input required name="org_name" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Contact Person</label><input required name="contact_name" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Email</label><input type="email" required name="email" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Phone</label><input required name="phone" class="input-field"></div>
             
             <div id="org-booklet-dl" class="hidden bg-blue-50 border border-blue-200 p-4 rounded text-center">
                <p class="text-blue-800 font-bold mb-2">Application Received!</p>
                <button type="button" class="btn-primary bg-gsBlue w-full text-xs">Download <span id="org-booklet-type">SCHOOL</span> Information Booklet (PDF)</button>
             </div>

             <button type="submit" class="btn-primary w-full bg-gsBlue hover:bg-blue-600" id="org-apply-submit-btn">Submit Request</button>
          </form>
       </div>
    </div>

    <!-- ROOM: BOOTCAMP APPLY -->
    <div id="room-bootcamp-apply" class="room max-w-xl mx-auto mt-8">
       <button onclick="showRoom('room-apply-hub')" class="text-gsGreen font-bold text-sm uppercase mb-4 hover:underline">← Back to Apply Hub</button>
       <div class="card border-t-4 border-gsGreen">
          <h2 class="text-2xl font-display uppercase mb-2">Holiday Bootcamp Registration</h2>
          <p class="text-sm text-gray-500 mb-6">Register a child for our intensive holiday creative camps.</p>
          <form id="bootcamp-apply-form" class="space-y-4">
             <div><label class="block text-sm font-bold mb-1">Child's Full Name</label><input required name="child_name" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Child's Age</label><input type="number" required name="child_age" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Parent / Guardian Phone</label><input required name="parent_phone" class="input-field"></div>
             <div><label class="block text-sm font-bold mb-1">Host Organization / Location</label><input name="host_org" class="input-field" placeholder="Leave blank for independent bootcamp"></div>
             <div id="bootcamp-apply-msg" class="hidden font-bold p-3 rounded text-sm text-center"></div>
             <button type="submit" class="btn-primary w-full bg-gsGreen hover:bg-green-600" id="bootcamp-apply-submit-btn">Register for Bootcamp</button>
          </form>
       </div>
    </div>

    <!-- ROOM: APPLY (School) -->`;

const startIndex = html.indexOf(landingStart);
const endIndex = html.indexOf(applyStart);

if(startIndex !== -1 && endIndex !== -1) {
  const before = html.substring(0, startIndex);
  const after = html.substring(endIndex + applyStart.length);
  html = before + newRooms + after;
  fs.writeFileSync('index.html', html);
  console.log("HTML patched successfully!");
} else {
  console.log("Could not find delimiters");
}
