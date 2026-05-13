const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "AI_Recipe_Generator_Project_Report.pdf");

const pageW = 595.28;
const pageH = 841.89;
const margin = 62;
const fontSize = 11;
const lineH = 16;

function esc(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function roman(num) {
  const map = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
    [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  for (const [n, r] of map) {
    while (num >= n) {
      out += r;
      num -= n;
    }
  }
  return out;
}

class PDF {
  constructor() {
    this.pages = [];
  }

  addPage(pageNumber = "", pageMode = "roman") {
    const page = { ops: [], pageNumber, pageMode };
    this.pages.push(page);
    return page;
  }

  text(page, text, x, y, size = fontSize, font = "F1", align = "left") {
    const width = size * 0.52 * String(text).length;
    let tx = x;
    if (align === "center") tx = (pageW - width) / 2;
    if (align === "right") tx = pageW - margin - width;
    page.ops.push(`BT /${font} ${size} Tf ${tx.toFixed(2)} ${y.toFixed(2)} Td (${esc(text)}) Tj ET`);
  }

  line(page, x1, y1, x2, y2, w = 0.8) {
    page.ops.push(`${w} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  rect(page, x, y, w, h) {
    page.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  save(file) {
    const objects = [];
    const add = (body) => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = add("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = add("__PAGES__");
    const font1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
    const font2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");
    const font3 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
    const pageIds = [];

    for (const page of this.pages) {
      if (page.pageNumber) {
        this.text(page, page.pageNumber, margin, 28, 10, "F1", "center");
      }
      const stream = page.ops.join("\n");
      const streamId = add(`<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}\nendstream`);
      const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R /F3 ${font3} 0 R >> >> /Contents ${streamId} 0 R >>`);
      pageIds.push(pageId);
    }

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf, "binary"));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, "binary");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    fs.writeFileSync(file, pdf, "binary");
  }
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function addPara(pdf, page, state, text, opts = {}) {
  const size = opts.size || fontSize;
  const max = opts.max || 88;
  const indent = opts.indent || 0;
  for (const line of wrap(text, max)) {
    if (state.y < 78) {
      page = newContentPage(pdf, state);
    }
    pdf.text(page, line, margin + indent, state.y, size, opts.bold ? "F2" : "F1");
    state.y -= opts.lineH || lineH;
  }
  state.y -= opts.after ?? 7;
  return page;
}

function addHeading(pdf, page, state, text, level = 1) {
  if (state.y < 115) page = newContentPage(pdf, state);
  state.y -= level === 1 ? 4 : 0;
  pdf.text(page, text, margin, state.y, level === 1 ? 18 : 13, "F2");
  state.y -= level === 1 ? 28 : 21;
  return page;
}

function addBullets(pdf, page, state, items) {
  for (const item of items) {
    page = addPara(pdf, page, state, `- ${item}`, { indent: 10, max: 84, after: 2 });
  }
  state.y -= 5;
  return page;
}

function addTable(pdf, page, state, rows, widths) {
  const rowH = 30;
  const x0 = margin;
  if (state.y - rows.length * rowH < 85) {
    page = newContentPage(pdf, state);
  }
  for (let r = 0; r < rows.length; r++) {
    if (state.y < 100) page = newContentPage(pdf, state);
    let x = x0;
    for (let c = 0; c < rows[r].length; c++) {
      pdf.rect(page, x, state.y - rowH + 8, widths[c], rowH);
      const lines = wrap(rows[r][c], Math.floor(widths[c] / 6));
      lines.slice(0, 2).forEach((line, i) => {
        pdf.text(page, line, x + 5, state.y - 8 - i * 11, 9, r === 0 ? "F2" : "F1");
      });
      x += widths[c];
    }
    state.y -= rowH;
  }
  state.y -= 12;
  return page;
}

function newContentPage(pdf, state) {
  state.pageNo += 1;
  state.y = pageH - margin;
  return pdf.addPage(String(state.pageNo), "arabic");
}

function centered(pdf, page, lines, startY, gap = 28) {
  let y = startY;
  for (const line of lines) {
    pdf.text(page, line.text, margin, y, line.size || 13, line.bold ? "F2" : "F1", "center");
    y -= line.gap || gap;
  }
}

function makeReport() {
  const pdf = new PDF();

  let p = pdf.addPage();
  centered(pdf, p, [
    { text: "A MAJOR PROJECT REPORT", size: 16, bold: true },
    { text: "ON", size: 12, bold: true, gap: 36 },
    { text: "\"AI RECIPE GENERATOR\"", size: 18, bold: true, gap: 42 },
    { text: "Submitted to", size: 12 },
    { text: "SAVITRIBAI PHULE PUNE UNIVERSITY", size: 15, bold: true, gap: 34 },
    { text: "In Partial Fulfilment of the Requirement for the Award of", size: 11 },
    { text: "MASTER OF COMPUTER APPLICATIONS (Under Engineering)", size: 13, bold: true, gap: 36 },
    { text: "BY", size: 12, bold: true },
    { text: "Student Name", size: 13, bold: true },
    { text: "Exam Seat No: 4444", size: 12, gap: 34 },
    { text: "UNDER THE GUIDANCE OF", size: 12, bold: true },
    { text: "Guide Name", size: 13, bold: true, gap: 44 },
    { text: "DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS", size: 13, bold: true },
    { text: "TRINITY ACADEMY OF ENGINEERING", size: 13, bold: true },
    { text: "Kondhwa Annex, Pune - 411048", size: 12 },
    { text: "2024-2025", size: 12 },
  ], 760, 24);

  p = pdf.addPage("ii");
  pdf.text(p, "TRINITY ACADEMY OF ENGINEERING", margin, 770, 15, "F2", "center");
  pdf.text(p, "Department of Master of Computer Applications", margin, 735, 13, "F2", "center");
  pdf.text(p, "CERTIFICATE", margin, 685, 17, "F2", "center");
  pdf.text(p, "This is to certify that the Major Project entitled", margin, 620, 12, "F1", "center");
  pdf.text(p, "\"AI RECIPE GENERATOR\"", margin, 590, 15, "F2", "center");
  pdf.text(p, "has been successfully submitted by", margin, 552, 12, "F1", "center");
  pdf.text(p, "Student Name", margin, 522, 13, "F2", "center");
  pdf.text(p, "Exam Seat No: 4444", margin, 498, 12, "F1", "center");
  const cert = "under the supervision of Guide Name and it is approved for the partial fulfillment of the requirement of Savitribai Phule Pune University, for the award of the degree of Master of Computer Applications (Under Engineering).";
  let y = 445;
  for (const line of wrap(cert, 84)) {
    pdf.text(p, line, margin, y, 11);
    y -= 18;
  }
  pdf.text(p, "Date:   /   /", margin, 340, 11);
  pdf.text(p, "Place: Pune", margin, 316, 11);
  pdf.text(p, "Guide Name", 78, 220, 11, "F2");
  pdf.text(p, "Dr. A. A. Bhusari", 238, 220, 11, "F2");
  pdf.text(p, "Dr. R. J. Patil", 420, 220, 11, "F2");
  pdf.text(p, "Project Guide", 82, 200, 10);
  pdf.text(p, "HOD", 278, 200, 10);
  pdf.text(p, "Principal", 438, 200, 10);
  pdf.text(p, "Internal Examiner", margin, 105, 11);
  pdf.text(p, "External Examiner", 380, 105, 11);

  p = pdf.addPage("iii");
  pdf.text(p, "Acknowledgement", margin, 748, 17, "F2", "center");
  y = 690;
  const ack = [
    "I would like to acknowledge all the teachers, faculty members, friends, and family members who helped and assisted me throughout my project work.",
    "First of all I would like to thank my respected guide Guide Name for time-to-time guidance, encouragement, valuable suggestions, and support during the development of this project. This work would not have been possible without the enthusiastic response and insight received from my guide.",
    "Furthermore, I would like to thank respected Dr. R. J. Patil, Principal, and Dr. A. A. Bhusari, Head of Department of Master of Computer Applications, for the guidance provided during my project work. I am also grateful to all the faculty members of Trinity Academy of Engineering, Pune for their cooperation.",
    "I would like to thank my parents for their constant support and encouragement, and all my friends for their valuable suggestions and help during the project.",
  ];
  let st = { y, pageNo: 0 };
  ack.forEach((t) => { p = addPara(pdf, p, st, t, { max: 86, after: 10 }); });
  pdf.text(p, "Student Name", 420, 175, 11, "F2");
  pdf.text(p, "Seat Number: 4444", 420, 153, 11);
  pdf.text(p, "Department of MCA", 420, 131, 11);

  p = pdf.addPage("iv");
  pdf.text(p, "Declaration by the candidate", margin, 748, 17, "F2", "center");
  st = { y: 680, pageNo: 0 };
  p = addPara(pdf, p, st, "I hereby declare that this project report titled \"AI RECIPE GENERATOR\" submitted towards partial fulfillment of requirements for the degree of MCA is an authentic record of my work carried out under the guidance of Guide Name.", { max: 86 });
  p = addPara(pdf, p, st, "I further declare that the material obtained from other resources is duly acknowledged in this report.", { max: 86 });
  pdf.text(p, "Date:   /   /", margin, 480, 11);
  pdf.text(p, "Place: Pune", margin, 456, 11);
  pdf.text(p, "Student Name", 420, 225, 11, "F2");
  pdf.text(p, "Seat Number: 4444", 420, 203, 11);
  pdf.text(p, "Department of MCA", 420, 181, 11);

  p = pdf.addPage("v");
  pdf.text(p, "Abstract", margin, 748, 17, "F2", "center");
  st = { y: 690, pageNo: 0 };
  [
    "The AI Recipe Generator is a web-based application designed to help users create recipes from available ingredients, dietary preferences, cuisine choices, cooking time, and serving requirements. The system reduces the everyday difficulty of deciding what to cook by combining a clean user interface with AI-assisted recipe generation.",
    "The application provides user authentication, profile management, pantry tracking, recipe generation, saved recipes, shopping list support, meal planning, and preference management. The frontend is developed using React, Vite, Tailwind CSS, React Router, Axios, and Lucide icons. The backend uses Node.js, Express.js, JWT authentication, bcrypt password hashing, PostgreSQL, Sequelize, and the Google GenAI package for AI integration.",
    "The project focuses on usability, personalization, data security, and practical meal planning. It supports a structured database design for users, preferences, pantry items, recipes, nutrition, meal plans, and shopping lists.",
    "Keywords: AI, recipe generation, meal planning, pantry management, React, Express, PostgreSQL, JWT.",
  ].forEach((t) => { p = addPara(pdf, p, st, t, { max: 86, after: 10 }); });

  p = pdf.addPage("vi");
  pdf.text(p, "Contents", margin, 760, 17, "F2", "center");
  const contents = [
    ["Certificate", "ii"], ["Acknowledgement", "iii"], ["Declaration", "iv"], ["Abstract", "v"],
    ["List of Figures", "viii"], ["List of Tables", "ix"], ["List of Abbreviation", "x"],
    ["1 About Project", "1"], ["2 Introduction", "3"], ["3 Literature Survey", "5"],
    ["4 Software Requirements Specification", "7"], ["5 Project Plan", "10"], ["6 System Design", "12"],
    ["7 Implementation", "16"], ["8 Software Testing", "18"], ["9 Output Screens", "20"],
    ["10 Conclusion & Future Work", "22"], ["References", "23"],
  ];
  y = 710;
  contents.forEach(([name, no]) => {
    pdf.text(p, name, 95, y, 11);
    pdf.text(p, no, 470, y, 11);
    y -= 24;
  });

  p = pdf.addPage("viii");
  pdf.text(p, "List of Figures", margin, 748, 17, "F2", "center");
  y = 690;
  ["6.1 System Architecture", "6.2 Level 0 Data Flow Diagram", "6.3 Use Case Diagram", "6.4 Entity Relationship Diagram", "9.1 Login Screen", "9.2 Recipe Generator Screen", "9.3 Dashboard Screen"].forEach((f, i) => {
    pdf.text(p, f, 95, y, 11);
    pdf.text(p, String(i + 1), 470, y, 11);
    y -= 24;
  });

  p = pdf.addPage("ix");
  pdf.text(p, "List of Tables", margin, 748, 17, "F2", "center");
  y = 690;
  ["3.1 Literature Survey", "4.1 Hardware Requirements", "4.2 Software Requirements", "5.1 Risk Analysis", "8.1 Test Cases"].forEach((f, i) => {
    pdf.text(p, f, 95, y, 11);
    pdf.text(p, String(i + 1), 470, y, 11);
    y -= 24;
  });

  p = pdf.addPage("x");
  pdf.text(p, "List of Abbreviation", margin, 748, 17, "F2", "center");
  st = { y: 690, pageNo: 0 };
  addTable(pdf, p, st, [
    ["Abbreviation", "Full Form"],
    ["AI", "Artificial Intelligence"], ["API", "Application Programming Interface"],
    ["DBMS", "Database Management System"], ["DFD", "Data Flow Diagram"],
    ["ERD", "Entity Relationship Diagram"], ["JWT", "JSON Web Token"],
    ["SRS", "Software Requirements Specification"], ["UI", "User Interface"],
  ], [160, 310]);

  st = { y: pageH - margin, pageNo: 1 };
  p = pdf.addPage("1");

  p = addHeading(pdf, p, st, "1 About Project");
  p = addHeading(pdf, p, st, "1.1 Title", 2);
  p = addPara(pdf, p, st, "AI Recipe Generator");
  p = addHeading(pdf, p, st, "1.2 Domain", 2);
  p = addPara(pdf, p, st, "Artificial Intelligence, Food Technology, Web Application Development, Personal Productivity, and Meal Planning.");
  p = addHeading(pdf, p, st, "1.3 Aim", 2);
  p = addPara(pdf, p, st, "The aim of this project is to develop a web application that generates useful recipes from user-provided ingredients and personal food preferences while also helping users manage pantry items, saved recipes, meal plans, and shopping lists.");
  p = addHeading(pdf, p, st, "1.4 Objective", 2);
  p = addBullets(pdf, p, st, [
    "Provide secure login, signup, and protected user pages.",
    "Allow users to enter ingredients or use pantry items for recipe generation.",
    "Support cuisine type, dietary restriction, serving size, and cooking time preferences.",
    "Display generated recipes with ingredients, instructions, time, difficulty, tags, and nutrition.",
    "Maintain database tables for users, preferences, recipes, pantry, meal plans, and shopping lists.",
  ]);
  p = addHeading(pdf, p, st, "1.5 Problem Statement", 2);
  p = addPara(pdf, p, st, "Many users struggle to decide what to cook with ingredients already available at home. Existing recipe websites usually require manual searching and do not adapt well to pantry stock, dietary restrictions, serving count, and preferred cuisines. This project solves the problem by generating personalized recipe suggestions and organizing the cooking workflow in a single application.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "2 Introduction");
  p = addHeading(pdf, p, st, "2.1 Overview", 2);
  p = addPara(pdf, p, st, "AI Recipe Generator is a full-stack web application. The React frontend provides pages for dashboard, pantry, recipe generator, saved recipes, recipe details, meal planner, shopping list, login, signup, and settings. The backend is built using Express.js and PostgreSQL, with JWT based authentication and user preference APIs.");
  p = addHeading(pdf, p, st, "2.2 Motivation", 2);
  p = addPara(pdf, p, st, "Food waste and meal decision fatigue are common daily problems. A user may have ingredients available but may not know how to combine them into a complete dish. The motivation of this project is to make cooking decisions faster, more personal, and more organized.");
  p = addHeading(pdf, p, st, "2.3 Project Scope and Limitations", 2);
  p = addBullets(pdf, p, st, [
    "Scope includes user account management, recipe generation workflow, pantry tracking, meal planning, and shopping list support.",
    "The current frontend uses dummy recipe data for some screens while the architecture is prepared for API integration.",
    "AI output quality depends on prompt design, available ingredients, and model response quality.",
    "Internet access and API keys are required for production AI generation.",
  ]);
  p = addHeading(pdf, p, st, "2.4 Methodology of Problem Solving", 2);
  p = addPara(pdf, p, st, "The project follows an iterative development method. Requirements are identified from daily cooking workflows, modules are separated into frontend pages and backend services, and data is stored in a relational database. Authentication and protected routes ensure that each user sees only personal data.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "3 Literature Survey");
  p = addHeading(pdf, p, st, "3.1 Similar Work", 2);
  p = addPara(pdf, p, st, "Recipe websites, meal planner applications, and pantry management tools already exist. However, many systems focus on only one part of the process. Some provide static recipes, some provide grocery planning, and some provide diet tracking. This project combines these ideas with AI assisted recipe creation.");
  p = addHeading(pdf, p, st, "3.2 Tabulated Short Survey", 2);
  p = addTable(pdf, p, st, [
    ["System", "Features", "Limitations"],
    ["Traditional recipe websites", "Search recipes by name, cuisine, ingredients.", "Less personalized and mostly manual."],
    ["Meal planner apps", "Calendar planning and grocery lists.", "Recipe creation is limited."],
    ["AI chat tools", "Can generate recipe text.", "No pantry, account, or saved workflow."],
    ["Proposed system", "AI recipe generation with pantry, preferences, recipes, meal plan, and shopping list.", "Needs complete API integration for all modules."],
  ], [135, 190, 145]);
  p = addHeading(pdf, p, st, "3.3 Advantages and Disadvantages of Previous System", 2);
  p = addBullets(pdf, p, st, [
    "Advantages: large recipe collections, familiar search interfaces, and ready-made cooking content.",
    "Disadvantages: less personalization, repeated manual filtering, limited pantry awareness, and weak integration with meal planning.",
  ]);
  p = addHeading(pdf, p, st, "3.4 Outcome of Literature Survey", 2);
  p = addPara(pdf, p, st, "The survey shows that a useful recipe system should be personalized, searchable, secure, and connected to the user's pantry and planning workflow. The proposed project therefore emphasizes user preferences, ingredient input, protected accounts, and database-backed planning modules.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "4 Software Requirements Specification");
  p = addHeading(pdf, p, st, "4.1 Functional Requirements", 2);
  p = addBullets(pdf, p, st, [
    "User can register and login using email and password.",
    "User can view and update profile information.",
    "User can update dietary restrictions, allergies, default servings, cuisine preferences, and measurement units.",
    "User can generate recipes using ingredients, pantry option, cuisine, dietary tags, servings, and cooking time.",
    "User can manage pantry items, saved recipes, meal plans, and shopping lists.",
  ]);
  p = addHeading(pdf, p, st, "4.2 External Interface Requirement", 2);
  p = addPara(pdf, p, st, "The user interface is browser based and built with React components. The software interface uses REST API calls through Axios, JSON request and response bodies, JWT bearer tokens, and PostgreSQL database connectivity through Node.js packages.");
  p = addHeading(pdf, p, st, "4.3 Nonfunctional Requirements", 2);
  p = addBullets(pdf, p, st, [
    "Performance: pages should load quickly and API responses should be optimized through indexes.",
    "Security: passwords must be hashed and protected routes must verify JWT tokens.",
    "Reliability: database constraints and cascading relations protect user-owned data.",
    "Usability: the interface should be simple enough for repeated daily use.",
    "Maintainability: frontend pages, backend controllers, models, routes, and middleware are separated.",
  ]);
  p = addHeading(pdf, p, st, "4.4 System Requirement", 2);
  p = addTable(pdf, p, st, [
    ["Type", "Requirement"],
    ["Database", "PostgreSQL with UUID extension, relational tables, JSONB fields, and indexes."],
    ["Frontend", "React 19, Vite, Tailwind CSS, React Router, Axios, Lucide React, React Hot Toast."],
    ["Backend", "Node.js, Express.js, JWT, bcryptjs, dotenv, cors, pg, Sequelize, Google GenAI."],
    ["Hardware", "Minimum 4 GB RAM, modern processor, 500 MB free disk space for development."],
  ], [130, 340]);
  p = addHeading(pdf, p, st, "4.5 Analysis Model", 2);
  p = addPara(pdf, p, st, "The system can be analyzed as a user-centered workflow: authentication, preference setup, ingredient entry, AI generation, recipe review, save action, meal planning, and shopping list preparation.");
  p = addHeading(pdf, p, st, "4.5.1 SDLC Model to be Applied", 2);
  p = addPara(pdf, p, st, "The iterative SDLC model is suitable because features such as pantry, generator, recipes, and meal planner can be designed, implemented, tested, and improved in cycles.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "5 Project Plan");
  p = addHeading(pdf, p, st, "5.1 Project Estimate", 2);
  p = addPara(pdf, p, st, "The project is divided into requirement analysis, UI design, backend setup, database design, authentication implementation, recipe generator workflow, testing, documentation, and deployment preparation.");
  p = addHeading(pdf, p, st, "5.1.1 Reconciled Estimates", 2);
  p = addTable(pdf, p, st, [
    ["Activity", "Estimated Duration"],
    ["Requirement analysis and study", "1 week"],
    ["Frontend page development", "2 weeks"],
    ["Backend API and database design", "2 weeks"],
    ["Integration and testing", "1 week"],
    ["Documentation and report", "1 week"],
  ], [260, 210]);
  p = addHeading(pdf, p, st, "5.2 Risk Management", 2);
  p = addTable(pdf, p, st, [
    ["Risk", "Impact", "Mitigation"],
    ["AI API failure", "Recipe generation may stop.", "Show validation, retry, and fallback messages."],
    ["Invalid user input", "Poor recipe result.", "Validate ingredients and preferences."],
    ["Database error", "User data may not load.", "Use constraints, indexes, and error handling."],
    ["Security issue", "Unauthorized access.", "Use JWT middleware and hashed passwords."],
  ], [140, 150, 180]);

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "6 System Design");
  p = addHeading(pdf, p, st, "6.1 System Architecture", 2);
  p = addPara(pdf, p, st, "The architecture uses a browser client, React frontend, Express backend, PostgreSQL database, and AI service. The browser sends requests to the frontend, the frontend communicates with backend REST APIs, the backend validates authentication and manages database operations, and the AI service generates recipe content.");
  drawArchitecture(pdf, p, st);
  p = addHeading(pdf, p, st, "6.2 Data Flow Diagrams", 2);
  p = addPara(pdf, p, st, "Level 0 DFD: User provides ingredients and preferences to the AI Recipe Generator System. The system authenticates the user, stores or fetches user data from the database, requests recipe generation, and returns recipes, meal plans, and shopping lists to the user.");
  p = addHeading(pdf, p, st, "6.3 Database Design", 2);
  p = addPara(pdf, p, st, "The database includes users, user_preferences, pantry_items, recipes, recipe_ingredients, recipe_nutrition, meal_plans, and shopping_lists. UUID primary keys are used, and user-owned records reference the users table with cascade behavior.");
  p = addHeading(pdf, p, st, "6.4 UML Diagrams", 2);
  p = addPara(pdf, p, st, "Main actors are User and System. The User can register, login, update preferences, manage pantry, generate recipe, save recipe, create meal plan, and generate shopping list. The System validates input, stores data, and communicates with the AI service.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "7 Implementation");
  p = addHeading(pdf, p, st, "7.1 Frontend Implementation", 2);
  p = addPara(pdf, p, st, "The frontend is implemented in React with Vite. App.jsx defines routes for login, signup, dashboard, pantry, recipe generator, recipes, recipe detail, meal plan, shopping list, and settings. ProtectedRoute prevents unauthenticated access. AuthContext manages user session state.");
  p = addHeading(pdf, p, st, "7.2 Backend Implementation", 2);
  p = addPara(pdf, p, st, "The backend uses Express.js. authController handles register, login, get profile, update profile, update password, and delete account. JWT tokens are generated after successful authentication. The auth middleware verifies protected requests.");
  p = addHeading(pdf, p, st, "7.3 Database Implementation", 2);
  p = addPara(pdf, p, st, "The schema.sql file creates the required PostgreSQL tables, indexes, and update timestamp triggers. The database supports JSONB fields for recipe ingredients, instructions, meal plan recipes, and shopping list ingredients.");
  p = addHeading(pdf, p, st, "7.4 Module Description", 2);
  p = addBullets(pdf, p, st, [
    "Authentication Module: handles user registration, login, token creation, and protected access.",
    "Recipe Generator Module: collects ingredients and preferences and displays generated recipe details.",
    "Pantry Module: stores ingredient stock information with quantity, unit, category, and expiration date.",
    "Meal Planner Module: organizes meals by date and meal type.",
    "Shopping List Module: tracks required ingredients and checked status.",
  ]);

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "8 Software Testing");
  p = addHeading(pdf, p, st, "8.1 Testing Strategy", 2);
  p = addPara(pdf, p, st, "Testing focuses on validation, authentication, protected navigation, user preference updates, recipe generation form behavior, database constraints, and API error handling.");
  p = addTable(pdf, p, st, [
    ["Test Case", "Expected Result"],
    ["Register with valid data", "Account created and token returned."],
    ["Login with wrong password", "Unauthorized response shown."],
    ["Open dashboard without token", "Redirect to login page."],
    ["Generate recipe without ingredients", "Validation message is displayed."],
    ["Update preferences", "Preferences are saved for the logged-in user."],
    ["Delete account", "User and related preferences are removed."],
  ], [230, 240]);
  p = addHeading(pdf, p, st, "8.2 Types of Testing", 2);
  p = addBullets(pdf, p, st, [
    "Unit Testing for individual controller and helper behavior.",
    "Integration Testing for frontend to backend API calls.",
    "Functional Testing for user workflows.",
    "Security Testing for JWT and password handling.",
    "Usability Testing for form clarity and navigation.",
  ]);

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "9 Output Screens");
  p = addPara(pdf, p, st, "This section describes the major screens implemented in the project. Actual screenshots can be inserted later if required by the college format.");
  p = addHeading(pdf, p, st, "9.1 Login and Signup Screen", 2);
  p = addPara(pdf, p, st, "The login and signup pages allow users to access the application securely. After login, the token is stored and used for authenticated API requests.");
  p = addHeading(pdf, p, st, "9.2 Dashboard Screen", 2);
  p = addPara(pdf, p, st, "The dashboard provides a cooking overview, including total recipes, pantry item count, meals planned for the week, quick action links, recent recipes, and upcoming meals.");
  p = addHeading(pdf, p, st, "9.3 Recipe Generator Screen", 2);
  p = addPara(pdf, p, st, "The recipe generator screen allows entry of ingredients, pantry usage, cuisine type, dietary restrictions, serving count, and cooking time. Generated output includes recipe name, description, ingredients, instructions, nutrition, tips, and save action.");
  p = addHeading(pdf, p, st, "9.4 Pantry, Meal Planner, and Shopping List Screens", 2);
  p = addPara(pdf, p, st, "These screens support the complete cooking workflow by managing ingredients, planning meals, and preparing grocery requirements.");

  p = newContentPage(pdf, st);
  p = addHeading(pdf, p, st, "10 Conclusion and Future Work");
  p = addHeading(pdf, p, st, "10.1 Conclusion", 2);
  p = addPara(pdf, p, st, "The AI Recipe Generator successfully demonstrates a full-stack approach to personalized recipe generation and meal organization. It combines a React based user interface, Express backend, JWT authentication, PostgreSQL database design, and AI integration capability. The system helps users convert available ingredients and preferences into useful recipe ideas while organizing pantry, meals, and shopping needs.");
  p = addHeading(pdf, p, st, "10.2 Future Work", 2);
  p = addBullets(pdf, p, st, [
    "Connect all frontend modules to production backend APIs.",
    "Improve AI prompts for nutrition-aware and budget-aware recipes.",
    "Add image generation or image upload for recipes.",
    "Add email reminders for expiring pantry items and planned meals.",
    "Deploy the system with secure environment variables and monitoring.",
  ]);
  p = addHeading(pdf, p, st, "References");
  p = addBullets(pdf, p, st, [
    "React documentation: https://react.dev/",
    "Vite documentation: https://vite.dev/",
    "Express.js documentation: https://expressjs.com/",
    "PostgreSQL documentation: https://www.postgresql.org/docs/",
    "JWT introduction: https://jwt.io/introduction",
    "Google GenAI package documentation.",
  ]);

  pdf.save(OUT);
}

function drawArchitecture(pdf, page, state) {
  if (state.y < 270) page = newContentPage(pdf, state);
  const y = state.y - 105;
  const boxes = [
    ["User Browser", 72, y],
    ["React + Vite UI", 215, y],
    ["Express API", 358, y],
    ["PostgreSQL DB", 215, y - 95],
    ["AI Service", 358, y - 95],
  ];
  boxes.forEach(([label, x, by]) => {
    pdf.rect(page, x, by, 110, 42);
    pdf.text(page, label, x + 14, by + 16, 10, "F2");
  });
  pdf.line(page, 182, y + 21, 215, y + 21);
  pdf.line(page, 325, y + 21, 358, y + 21);
  pdf.line(page, 270, y, 270, y - 53);
  pdf.line(page, 413, y, 413, y - 53);
  pdf.text(page, "HTTPS / JSON API", 230, y + 39, 9);
  pdf.text(page, "SQL", 286, y - 38, 9);
  pdf.text(page, "Prompt / Response", 422, y - 38, 9);
  state.y = y - 135;
}

makeReport();
console.log(`Created ${OUT}`);
