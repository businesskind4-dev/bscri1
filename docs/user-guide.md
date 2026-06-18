# BSCRI User Guide
## Botswana Supply Chain Readiness Index

**Version:** 1.0.0  
**Last Updated:** 2026-06-17

---

## Overview

The Botswana Supply Chain Readiness Index (BSCRI) is a professional assessment tool that measures your organization's supply chain competitiveness. This guide will walk you through the assessment process and explain how to interpret your results.

---

## Table of Contents

1. [Taking the Assessment](#taking-the-assessment)
2. [Understanding Your Results](#understanding-your-results)
3. [Action Plan](#action-plan)
4. [Admin Dashboard Guide](#admin-dashboard-guide)
5. [Frequently Asked Questions](#frequently-asked-questions)

---

## Taking the Assessment

### Step 1: Access the Platform

Visit the BSCRI website provided by Supply Chain Circle (SCC).

### Step 2: Start the Assessment

Click the **"Start Assessment"** button on the landing page.

You will see an introduction explaining the 7 dimensions of supply chain readiness:

| Dimension | What It Measures |
|-----------|------------------|
| Procurement Capability | How effectively you source goods and services |
| Logistics & Operations | How efficiently products and materials flow |
| Compliance & Governance | Your regulatory and policy readiness |
| Digital Capability | Your technology and data maturity |
| Supplier & Partnership Ecosystem | Your supplier relationships and local content |
| Resilience & Risk | Your ability to withstand disruptions |
| Trade & Growth Readiness | Your ability to compete regionally |

### Step 3: Answer the Questions

You will be presented with 25 questions, one at a time.

For each question:

1. Read the question carefully
2. Select the option that best describes your organization
3. Click **"Next"** to proceed
4. You can go back using the **"Previous"** button

**The assessment takes approximately 15 minutes to complete.**

### Step 4: Submit Your Assessment

After answering all 25 questions:

1. Click **"Submit Assessment"**
2. Enter your organization details:
   - **Sector:** Mining, Manufacturing, Retail, Services, Agriculture, Government, Nonprofit, Other
   - **Region:** Gaborone, Francistown, Maun, Lobatse, Selebi-Phikwe, Other
   - **Company Size:** Micro (1-5), Small (6-50), Medium (51-200), Large (201-500), Enterprise (500+)

### Step 5: View Your Results

Your results will appear instantly, including:

- **Overall Readiness Score** (0-100)
- **Maturity Level** (Foundational → Advanced)
- **Dimension Scores** (7 individual scores)
- **Visual Radar Chart**
- **Personalized Action Plan**

---

## Understanding Your Results

### Overall Readiness Score

Your overall score (0-100) represents your organization's supply chain competitiveness.

| Score Range | Interpretation |
|-------------|----------------|
| 0-40 | Critical gaps exist. Urgent action is needed. |
| 41-55 | Gaps exist. Action is required to advance. |
| 56-70 | On track but room for improvement exists. |
| 71-85 | Strong capability. Positioned for regional competition. |
| 86-100 | World-class capability. Ready for international competition. |

### Maturity Levels

| Level | Description |
|-------|-------------|
| **Foundational** | Basic processes. Significant gaps in capabilities. |
| **Emerging** | Some formal processes. Gaps remain. |
| **Developing** | Solid foundation. Room for optimization. |
| **Established** | Strong capabilities. Regionally competitive. |
| **Advanced** | World-class capabilities. Fully competitive. |

### Dimension Scores

Each dimension is scored from 0-100. Higher scores indicate stronger capability.

| Score | Status |
|-------|--------|
| 0-40 | Critical — Action required |
| 41-59 | Gap — Action recommended |
| 60-79 | Good — Continuous improvement |
| 80-100 | Excellent — Maintain and share |

---

## Action Plan

Your personalized action plan includes prioritized recommendations.

### How Recommendations Are Generated

1. **Identify Gaps:** Dimensions with scores below 60 are flagged
2. **Prioritize:** Critical gaps (0-40) receive highest priority
3. **Map to Resources:** Each recommendation includes a specific resource

### Recommendation Priority Levels

| Priority | Description | When to Act |
|----------|-------------|-------------|
| **Critical** | Urgent action needed | Within 30 days |
| **High** | Address immediately | Within 60 days |
| **Medium** | Plan for implementation | Within 3-6 months |
| **Low** | Continuous improvement | Within 12 months |

### Example Recommendations

**Procurement Score: 35 (Critical Gap)**

| Recommendation | Resource |
|----------------|----------|
| Establish a basic procurement policy | BITC Procurement Guidelines |
| Train staff on procurement fundamentals | LEA Entrepreneurship Training |
| Document supplier evaluation criteria | BSCRI Supplier Evaluation Template |

---

## Admin Dashboard Guide

### Accessing the Dashboard

1. Navigate to `/admin` on your BSCRI URL
2. Enter your admin credentials
3. Click **"Sign In"**

### Dashboard Overview

The dashboard displays:

| Section | Description |
|---------|-------------|
| **Stats Cards** | Total assessments, average score, sectors, regions |
| **Charts** | Score by sector, maturity distribution |
| **Data Table** | All submissions with filtering and pagination |

### Using the Data Table

**Filters:**

| Filter | Purpose |
|--------|---------|
| Sector | View assessments from specific sectors |
| Region | View assessments from specific regions |
| Maturity | View assessments at specific maturity levels |

**Actions:**

| Action | Description |
|--------|-------------|
| View | Click to see full assessment details |
| Export | Download all data as JSON |

### Viewing Assessment Details

Click the **"View"** button to see:

- **Organization Details:** Sector, region, company size
- **Dimension Scores:** All 7 scores with color coding
- **Maturity Level:** Current maturity classification
- **Question Responses:** All 25 questions with selected answers

### Exporting Data

Click **"Export Data"** to download all assessments as a JSON file.

The export includes:
- All assessment metadata
- All dimension scores
- All question responses
- Timestamps

---

## Frequently Asked Questions

### General

**Q: Who should take the assessment?**

A: Any organization involved in supply chain, procurement, or logistics operations in Botswana. The assessment is designed for SMEs, growing businesses, large enterprises, government entities, and non-profits.

**Q: How long does the assessment take?**

A: Approximately 15 minutes.

**Q: Is my data confidential?**

A: Yes. Individual responses are private. Only aggregated, anonymized data is shared in public reports.

**Q: Can I retake the assessment?**

A: Yes. You can retake the assessment at any time to track your progress.

---

### Technical

**Q: What browsers are supported?**

A: Chrome, Firefox, Safari, Edge (latest versions).

**Q: Do I need to create an account?**

A: No. The assessment is open and does not require registration.

**Q: Will my results be saved?**

A: Yes. Your results are saved in the database and can be accessed using the unique ID provided.

**Q: Can I share my results?**

A: Yes. You can share the results link provided after submission.

---

### Admin

**Q: How do I access the admin dashboard?**

A: Navigate to `/admin` and log in with your admin credentials.

**Q: How do I reset my admin password?**

A: Update the `ADMIN_PASSWORD` environment variable in your backend deployment and restart the server.

**Q: How do I export all data?**

A: Click the **"Export Data"** button in the admin dashboard.

**Q: Can I filter assessments?**

A: Yes. Use the filters by sector, region, and maturity level.

---

### Methodology

**Q: Where do the questions come from?**

A: The questions are based on international supply chain frameworks (GSCF, SCOR) adapted for the Botswana context.

**Q: What do the scores mean?**

A: Scores represent your organization's capability relative to the 7 dimensions of supply chain readiness.

**Q: How is my overall score calculated?**

A: Dimension scores are weighted and averaged to produce the overall score.

**Q: What is a "perfect" score?**

A: An organization scoring 100 demonstrates the capabilities, governance, resilience, and market readiness required to compete effectively in regional and international supply chains.

---

## Support

For questions, feedback, or support:

**Supply Chain Circle (SCC)**  
Botswana

📘 [Facebook Page](https://www.facebook.com/profile.php?id=61589321477563)

---

## Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-17 | SCC | Initial release |

---

**© 2026 Supply Chain Circle (SCC). All rights reserved.**
