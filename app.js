// ========== SUPABASE CONFIG ==========
//const SUPABASE_URL = "https://lemvtzisfvsnmmlluxau.supabase.co";
//const SUPABASE_KEY = "sb_publishable_Q_YSS7a4-hnIPvGiDJTnXQ_OeZhQeCd";
//const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== STATE ==========
const state = {
  page: "dashboard",
  user: null,
  profile: null,
  nav: [
    ["dashboard", "⌂", "Dashboard"],
    ["ride", "🚗", "Ride"],
    ["logistics", "📦", "Logistics"],
    ["market", "🚘", "Market"],
    ["garage", "🔧", "Garage"],
    ["business", "🏢", "Business"],
    ["messages", "💬", "Messages"],
    ["control", "🛡️", "Control"]
  ],
  trips: [{
    id: "TH-10482",
    driver: "Musa Ibrahim",
    vehicle: "Toyota Corolla • KNG-421AA",
    from: "Nassarawa",
    to: "Kano Central",
    remain: "8.4 km",
    status: "ON TRIP"
  }],
  listings: [
    { name: "Toyota Camry 2021", price: "₦18,500,000", seller: "ABC Motors", city: "Kano", verified: true },
    { name: "Honda Accord 2019", price: "₦14,800,000", seller: "AutoHub Dealer", city: "Abuja", verified: true },
    { name: "Lexus RX 350 2020", price: "₦31,200,000", seller: "Sani Autos", city: "Kano", verified: false }
  ],
  mechanics: [
    { name: "Musa Auto Diagnostics", skills: "Diagnostics • AC • Electrical", rating: "4.8", home: true },
    { name: "Northern Motor Works", skills: "Engine • Transmission • Brakes", rating: "4.7", home: false },
    { name: "Kano Mobile Mechanic", skills: "Roadside • Battery • Tyres", rating: "4.6", home: true }
  ]
};

// ========== AUTH ==========
function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("tabLogin").className = "btn";
  document.getElementById("tabRegister").className = "btn secondary";
  document.getElementById("authMessage").textContent = "";
}

function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.getElementById("tabLogin").className = "btn secondary";
  document.getElementById("tabRegister").className = "btn";
  document.getElementById("authMessage").textContent = "";
}

async function doLogin() {
  var email = document.getElementById("loginEmail").value.trim();
  var password = document.getElementById("loginPassword").value;
  var msg = document.getElementById("authMessage");
  if (!email || !password) { msg.textContent = "Please enter email and password"; return; }
  msg.textContent = "Logging in...";
  var result = await supabase.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    msg.textContent = result.error.message;
  } else {
    state.user = result.data.user;
    await loadProfile();
  }
}

async function doRegister() {
  var name = document.getElementById("regName").value.trim();
  var email = document.getElementById("regEmail").value.trim();
  var password = document.getElementById("regPassword").value;
  var msg = document.getElementById("authMessage");
  if (!name || !email || !password) { msg.textContent = "Please fill all fields"; return; }
  if (password.length < 6) { msg.textContent = "Password must be at least 6 characters"; return; }
  msg.textContent = "Creating account...";
  var result = await supabase.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: name } }
  });
  if (result.error) {
    msg.textContent = result.error.message;
  } else {
    msg.textContent = "Account created! Please login.";
    showLogin();
  }
}

async function doLogout() {
  await supabase.auth.signOut();
  state.user = null;
  state.profile = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("kycScreen").style.display = "none";
  document.getElementById("bottomNav").style.display = "none";
  document.getElementById("authScreen").style.display = "flex";
  showLogin();
}
// ========== PROFILE / KYC ==========
async function loadProfile() {
  var { data, error } = await supabase
    .from("Profiles")
    .select("*")
    .eq("user_id", state.user.id)
    .maybeSingle();

  if (data) {
    state.profile = data;
    if (data.kyc_status === "verified" || data.kyc_status === "pending") {
      showApp();
    } else {
      showKyc();
    }
  } else {
    showKyc();
  }
}

function showKyc() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("app").style.display = "none";
  document.getElementById("bottomNav").style.display = "none";
  document.getElementById("kycScreen").style.display = "flex";
  updateKycFields();
}

function showApp() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("kycScreen").style.display = "none";
  document.getElementById("app").style.display = "block";
  if (window.innerWidth <= 700) {
    document.getElementById("bottomNav").style.display = "flex";
  }
  renderNav();
  render();
}

function updateKycFields() {
  var role = document.getElementById("kycRole").value;
  var extra = document.getElementById("kycExtraFields");
  var html = "";

  if (role === "passenger") {
    html = '<label>NIN Number</label><input class="input" id="kycNin" placeholder="Enter your NIN">';
  } else if (role === "mechanic") {
    html = '<label>NIN Number</label><input class="input" id="kycNin" placeholder="Enter your NIN">' +
           '<label>Trade Test Certificate</label><input class="input" id="kycTrade" placeholder="Certificate details">' +
           '<label>Garage Photo / Location</label><input class="input" id="kycGarage" placeholder="Photo link or description">';
  } else if (role === "seller" || role === "agent") {
    html = '<label>NIN Number</label><input class="input" id="kycNin" placeholder="Enter your NIN">' +
           '<label>CAC Number</label><input class="input" id="kycCac" placeholder="CAC number">' +
           '<label>Shop / Vehicle Photo</label><input class="input" id="kycShop" placeholder="Photo or location description">';
  } else if (role === "transport_company" || role === "driver") {
    html = '<label>NIN Number</label><input class="input" id="kycNin" placeholder="Enter NIN">' +
           '<label>Company CAC Number</label><input class="input" id="kycCac" placeholder="CAC number">' +
           '<label>Operating Papers / Notes</label><input class="input" id="kycNote" placeholder="Documents description">';
  }

  extra.innerHTML = html;
}

async function submitKyc() {
  var role = document.getElementById("kycRole").value;
  var fullName = document.getElementById("kycName").value.trim();
  var phone = document.getElementById("kycPhone").value.trim();
  var msg = document.getElementById("kycMessage");

  if (!role || !fullName) {
    msg.textContent = "Please fill required fields";
    return;
  }

  var payload = {
    user_id: state.user.id,
    full_name: fullName,
    role: role,
    phone: phone,
    nin: document.getElementById("kycNin") ? document.getElementById("kycNin").value : "",
    cac_number: document.getElementById("kycCac") ? document.getElementById("kycCac").value : "",
    trade_certificate: document.getElementById("kycTrade") ? document.getElementById("kycTrade").value : "",
    shop_photo_url: document.getElementById("kycShop") ? document.getElementById("kycShop").value : "",
    garage_photo_url: document.getElementById("kycGarage") ? document.getElementById("kycGarage").value : "",
    documents_note: document.getElementById("kycNote") ? document.getElementById("kycNote").value : "",
    kyc_status: "pending"
  };

  msg.textContent = "Submitting KYC...";

  var { error } = await supabase.from("Profiles").insert([payload]);

  if (error) {
    msg.textContent = "Error: " + error.message;
  } else {
    msg.textContent = "KYC submitted! Status: Pending";
    state.profile = payload;
    setTimeout(showApp, 1500);
  }
}

async function checkSession() {
  var session = await supabase.auth.getSession();
  if (session.data.session) {
    state.user = session.data.session.user;
    await loadProfile();
  }
}
// ========== UI ==========
function renderNav() {
  document.getElementById("nav").innerHTML = state.nav.map(function(item) {
    var id = item[0], icon = item[1], label = item[2];
    var active = state.page === id ? "active" : "";
    return '<button class="nav-item ' + active + '" onclick="go(\'' + id + '\')">' + icon + ' ' + label + '</button>';
  }).join("");

  var mobileItems = [
    ["dashboard", "⌂", "Home"],
    ["ride", "🚗", "Ride"],
    ["logistics", "📦", "Logistics"],
    ["market", "🚘", "Market"],
    ["garage", "🔧", "Garage"]
  ];
  document.getElementById("bottomNav").innerHTML = mobileItems.map(function(item) {
    var id = item[0], icon = item[1], label = item[2];
    var active = state.page === id ? "active" : "";
    return '<button class="bottom-nav-item ' + active + '" onclick="go(\'' + id + '\')"><span class="icon">' + icon + '</span><span>' + label + '</span></button>';
  }).join("");
}

function go(page) {
  state.page = page;
  renderNav();
  render();
  window.scrollTo(0, 0);
}

function render() {
  var titles = {
    dashboard: ["Dashboard", "Mobility, logistics, automotive and garage services in one ecosystem."],
    ride: ["TRANSHUB Ride", "Book, track and manage passenger journeys."],
    logistics: ["Transport & Logistics", "Post loads, bargain with transporters and manage protected transactions."],
    market: ["Auto Market", "Buy, sell, facilitate and create vehicle stores."],
    garage: ["TRANSHUB Garage", "Find verified mechanics for workshop and home services."],
    business: ["Business & Agents", "Register companies, agents and service partners."],
    messages: ["Communication Hub", "Admin, driver, passenger, agent and business messaging."],
    control: ["TRANSHUB Control", "Central operational control and AI-assisted administration."]
  };
  document.getElementById("pageTitle").textContent = titles[state.page][0];
  document.getElementById("pageSub").textContent = titles[state.page][1];
  document.getElementById("content").innerHTML = pages[state.page]();
}

function metric(n, t, s) {
  return '<div class="card"><div class="muted">' + t + '</div><div class="metric">' + n + '</div><div class="muted">' + s + '</div></div>';
}
function service(i, t, d, a) {
  return '<div class="card service" onclick="' + a + '"><div class="icon">' + i + '</div><h3>' + t + '</h3><p class="muted">' + d + '</p><button class="btn secondary">Open</button></div>';
}
function tripCard(t) {
  return '<div class="row"><div><b>' + t.from + ' → ' + t.to + '</b><p class="muted">' + t.driver + ' • ' + t.vehicle + '</p></div><div style="text-align:right"><b>' + t.remain + '</b><p class="muted">' + t.status + '</p></div></div><div style="margin-top:13px"><button class="btn secondary" onclick="chat(\'Musa Ibrahim — Driver\')">Chat driver</button> <button class="btn secondary" onclick="toast(\'Trip shared with emergency contact (demo)\')">Share trip</button></div>';
}

var pages = {
  dashboard: function() {
    var statusBadge = state.profile ? '<span class="badge">' + (state.profile.kyc_status || "pending").toUpperCase() + '</span>' : "";
    return '<div class="grid">' +
      metric("146", "Active trips", "Live mobility") +
      metric("32", "Open loads", "Logistics") +
      metric("84", "Vehicles listed", "Auto Market") +
      metric("18", "Garage jobs", "Services") +
      '</div><div class="section"><h2>What do you need today? ' + statusBadge + '</h2><div class="cards">' +
      service("🚗", "Book a Ride", "Request a driver and track the journey.", "go('ride')") +
      service("📦", "Move a Load", "Post cargo and receive transporter offers.", "go('logistics')") +
      service("🚘", "Buy / Sell Vehicle", "Browse listings or create a vehicle store.", "go('market')") +
      service("🔧", "Find a Mechanic", "Workshop or verified home service.", "go('garage')") +
      service("🏢", "Register Business", "Join TRANSHUB as company or agent.", "go('business')") +
      service("💬", "Customer Care", "Chat with TRANSHUB support and AI.", "go('messages')") +
      '</div></div><div class="section"><div class="card"><div class="row"><h2>Live trip</h2><span class="badge">● LIVE</span></div>' + tripCard(state.trips[0]) + '</div></div>';
  },
  ride: function() {
    return '<div class="grid-3"><div class="card"><h2>Book a ride</h2><label>Pickup</label><input class="input" id="pickup" value="Nassarawa, Kano"><label>Destination</label><input class="input" id="destination" value="Kano Central"><label>Vehicle</label><select class="input"><option>Economy</option><option>Comfort</option><option>XL</option></select><button class="btn" onclick="bookRide()">Find driver</button></div><div class="card" style="grid-column:span 2"><div class="row"><h2>Live journey</h2><span class="badge">ON TRIP</span></div><div class="map"><div class="road"></div><div class="route"></div><div class="pin a">📍</div><div class="pin b">🏁</div><div class="trip-box"><b>8.4 km remaining</b><br><span class="muted">ETA 17 min • Driver: Musa Ibrahim</span></div></div></div></div><div class="section"><div class="card"><h2>Current trip</h2>' + tripCard(state.trips[0]) + '</div></div>';
  },
  logistics: function() {
    var loads = [["TH-L1001","20 tonnes cement","Kano → Abuja","₦500,000","3 offers"],["TH-L1002","12 pallets food","Kaduna → Lagos","₦720,000","5 offers"],["TH-L1003","Furniture","Kano → Kaduna","₦180,000","2 offers"]];
    var html = '<div class="row"><div><h2>Loads marketplace</h2><p class="muted">Companies and agents post loads; transporters submit offers.</p></div><button class="btn" onclick="openLoad()">+ Post load</button></div><div class="section cards">';
    for (var i = 0; i < loads.length; i++) {
      var x = loads[i];
      html += '<div class="card"><span class="badge gray">' + x[0] + '</span><h3>' + x[1] + '</h3><p>' + x[2] + '</p><b>' + x[3] + '</b><p class="muted">' + x[4] + '</p><button class="btn secondary" onclick="openOffer(\'' + x[0] + '\')">View & bargain</button></div>';
    }
    return html + '</div>';
  },
  market: function() {
    var html = '<div class="row"><div><h2>Vehicle marketplace</h2><p class="muted">Buyer • Seller • Facilitator • Store</p></div><button class="btn" onclick="openListing()">+ List vehicle</button></div><div class="section cards">';
    for (var i = 0; i < state.listings.length; i++) {
      var v = state.listings[i];
      var badge = v.verified ? '<span class="badge">✓ VERIFIED</span>' : '<span class="badge orange">Pending review</span>';
      html += '<div class="card">' + badge + '<h3>' + v.name + '</h3><p class="muted">' + v.city + ' • ' + v.seller + '</p><div class="metric" style="font-size:20px">' + v.price + '</div><button class="btn secondary" onclick="openVehicle(\'' + v.name + '\')">View vehicle</button></div>';
    }
    return html + '</div><div class="section"><div class="card"><div class="row"><div><h2>Seller stores</h2><p class="muted">Custom storefronts for dealers and facilitators.</p></div><button class="btn" onclick="openStore()">Create store</button></div></div></div>';
  },
  garage: function() {
    var html = '<div class="row"><div><h2>Verified mechanics</h2><p class="muted">Workshop and home/roadside services.</p></div><button class="btn" onclick="openMechanic()">Register as mechanic</button></div><div class="section cards">';
    for (var i = 0; i < state.mechanics.length; i++) {
      var m = state.mechanics[i];
      html += '<div class="card"><span class="badge">✓ Verified</span><h3>' + m.name + '</h3><p>' + m.skills + '</p><p>⭐ ' + m.rating + ' ' + (m.home ? "• Home service" : "• Workshop") + '</p><button class="btn" onclick="bookMechanic(\'' + m.name + '\')">Request service</button></div>';
    }
    return html + '</div>';
  },
  business: function() {
    var items = [["🚚","Transport company","Register fleet, drivers and loads."],["🔧","Repair company","Register workshops and mechanics."],["🚘","Vehicle dealer","Create a store and manage inventory."],["🤝","Facilitator / Agent","Represent customers or businesses."],["📅","Booking company","Connect your booking service to TRANSHUB."],["🏢","Other partner","Use TRANSHUB as your digital technology/agency platform."]];
    var html = '<div class="grid-3">';
    for (var i = 0; i < items.length; i++) {
      var x = items[i];
      html += '<div class="card service" onclick="openBusiness(\'' + x[1] + '\')"><div class="icon">' + x[0] + '</div><h3>' + x[1] + '</h3><p class="muted">' + x[2] + '</p><button class="btn secondary">Register</button></div>';
    }
    return html + '</div>';
  },
  messages: function() {
    return '<div class="grid-3"><div class="card"><h2>Conversations</h2><button class="nav-item active" style="color:#fff" onclick="chat(\'TRANSHUB Admin\')">🛡️ TRANSHUB Admin</button><button class="nav-item" onclick="chat(\'Musa Ibrahim — Driver\')">🚗 Musa Ibrahim — Driver</button><button class="nav-item" onclick="chat(\'ABC Motors — Seller\')">🚘 ABC Motors — Seller</button><button class="nav-item" onclick="chat(\'Logistics Agent\')">📦 Logistics Agent</button></div><div class="card" style="grid-column:span 2"><h2>TRANSHUB Admin</h2><div class="chat" id="chat"><div class="msg">Welcome to TRANSHUB support. How can we assist?</div><div class="msg me">I need help with my current trip.</div><div class="msg">Your trip TH-10482 is active. Remaining distance is 8.4 km.</div></div><div class="row" style="margin-top:10px"><input class="input" id="chatInput" placeholder="Write a message..."><button class="btn" onclick="sendMsg()">Send</button></div></div></div>';
  },
  control: function() {
    return '<div class="grid">' + metric("146","Live trips","GPS monitoring") + metric("3","Risk alerts","AI flagged") + metric("7","Documents","Expiring soon") + metric("2","Disputes","Human review") + '</div><div class="section grid-3"><div class="card"><h2>🤖 AI Operations Agent</h2><p>AI summarizes incidents, flags anomalies and recommends next actions.</p><button class="btn" onclick="openAI()">Open AI Control</button></div><div class="card"><h2>🛡️ Verification</h2><p>Driver, vehicle, mechanic and business verification queue.</p><button class="btn secondary" onclick="toast(\'Verification queue opened\')">Review queue</button></div><div class="card"><h2>💰 Transactions</h2><p>Protected transaction states and payment-provider events.</p><button class="btn secondary" onclick="toast(\'Transaction ledger opened\')">Open ledger</button></div></div><div class="section card"><h2>Recent alerts</h2><table class="table"><tr><th>Type</th><th>Reference</th><th>Status</th></tr><tr><td>Document expiry</td><td>Driver TH-D882</td><td><span class="badge orange">7 days</span></td></tr><tr><td>Vehicle listing review</td><td>VH-7811</td><td><span class="badge orange">Review</span></td></tr><tr><td>Trip anomaly</td><td>TH-10482</td><td><span class="badge">Resolved</span></td></tr></table></div>';
  }
};

function modal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function openAI() {
  modal('<h2>✦ TRANSHUB AI Agent</h2><p class="muted">Prototype assistant</p><input class="input" id="aiInput" placeholder="Ask about a trip, vehicle, load or garage"><button class="btn" onclick="aiAnswer()">Ask AI</button><div id="aiOut" style="margin-top:15px"></div>');
}
function aiAnswer() {
  var q = document.getElementById("aiInput").value.toLowerCase();
  var a = "I can assist with rides, logistics, vehicles, garage services, verification and support.";
  if (q.indexOf("trip") !== -1) a = "Trip TH-10482 is active with 8.4 km remaining.";
  else if (q.indexOf("vehicle") !== -1) a = "I can help with vehicle listings and verification.";
  else if (q.indexOf("load") !== -1) a = "There are sample loads in Logistics.";
  else if (q.indexOf("mechanic") !== -1) a = "There are verified mechanics available.";
  document.getElementById("aiOut").innerHTML = '<div class="card">' + a + '</div>';
}
function bookRide() { toast("Driver search started — demo matched: Musa Ibrahim"); go("ride"); }
function openLoad() { modal('<h2>Post a load</h2><label>Cargo</label><input class="input" placeholder="e.g. 20 tonnes cement"><label>Pickup → Destination</label><input class="input" placeholder="Kano → Abuja"><label>Budget</label><input class="input" placeholder="₦500,000"><button class="btn" onclick="closeModal();toast(\'Load posted\')">Post load</button>'); }
function openOffer(id) { modal('<h2>' + id + ' — Offers</h2><p>Budget: <b>₦500,000</b></p><div class="card"><b>Transporter A</b><p>₦470,000</p><button class="btn secondary" onclick="toast(\'Counter sent\');closeModal()">Counter</button></div><div class="card"><b>Transporter B</b><p>₦485,000</p><button class="btn" onclick="toast(\'Offer accepted\');closeModal()">Accept</button></div>'); }
function openListing() { modal('<h2>List a vehicle</h2><input class="input" placeholder="Make / model / year"><input class="input" placeholder="Price"><input class="input" placeholder="Location"><button class="btn" onclick="closeModal();toast(\'Submitted for verification\')">Submit</button>'); }
function openVehicle(n) { modal('<h2>' + n + '</h2><span class="badge">Listing</span><p>Photos and details would appear here.</p><div class="card"><b>Protected purchase</b><p class="muted">Offer → payment held → inspection → release</p><button class="btn" onclick="toast(\'Protected transaction created\');closeModal()">Make offer</button></div>'); }
function openStore() { modal('<h2>Create vehicle store</h2><input class="input" placeholder="Store name"><input class="input" placeholder="Description"><input class="input" placeholder="Address"><button class="btn" onclick="closeModal();toast(\'Store created\')">Create</button>'); }
function openMechanic() { modal('<h2>Mechanic registration</h2><input class="input" placeholder="Name"><input class="input" placeholder="Expertise"><input class="input" placeholder="Workshop address"><button class="btn" onclick="closeModal();toast(\'Submitted for verification\')">Register</button>'); }
function bookMechanic(n) { modal('<h2>Request service</h2><p><b>' + n + '</b></p><select class="input"><option>Workshop</option><option>Home service</option><option>Roadside</option></select><input class="input" placeholder="Describe problem"><button class="btn" onclick="closeModal();toast(\'Request sent\')">Request</button>'); }
function openBusiness(n) { modal('<h2>' + n + '</h2><input class="input" placeholder="Company name"><input class="input" placeholder="Phone / email"><input class="input" placeholder="Address"><button class="btn" onclick="closeModal();toast(\'Submitted\')">Submit</button>'); }
function chat(name) { toast("Opened: " + name); }
function sendMsg() {
  var i = document.getElementById("chatInput"), v = i.value.trim();
  if (!v) return;
  document.getElementById("chat").innerHTML += '<div class="msg me">' + v + '</div>';
  i.value = "";
  setTimeout(function() { document.getElementById("chat").innerHTML += '<div class="msg">Thanks. Support received your message.</div>'; }, 400);
}
function toast(t) {
  var d = document.createElement("div");
  d.textContent = t;
  Object.assign(d.style, { position:"fixed", right:"20px", bottom:"90px", background:"#172033", color:"#fff", padding:"13px 17px", borderRadius:"10px", zIndex:20, maxWidth:"80%", fontSize:"14px" });
  document.body.appendChild(d);
  setTimeout(function() { d.remove(); }, 2600);
}

// Start the app
// checkSession();
showLogin();
