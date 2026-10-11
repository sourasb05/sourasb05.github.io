/*
 * JOURNALS — special issues and recommended journals for conferences.html.
 * Maintained by hand (not touched by the weekly conference update).
 *
 * Special issues: most are collected weekly by scripts/update_special_issues.py into
 * special_issues.js. Add others here; they are merged, sorted by deadline and hidden
 * automatically once the deadline has passed.
 *   deadline: "YYYY-MM-DD" (treated as end of day, Anywhere on Earth)
 *   category: "ai" | "security" | "comm"
 *
 * Journals:
 *   impact:   Journal Impact Factor from the latest JCR (2026 release, 2025 data),
 *             as shown on the publisher's site; null if the journal has none.
 *   quartile: best SCImago (SJR 2025, Scopus-based) quartile.
 *   index:    Web of Science / Scopus coverage.
 */
window.JOURNALS = {
  updated: "2026-10-11",

  // Hand-picked calls from publishers the weekly script cannot read (e.g. Elsevier).
  // Calls from IEEE IoT-J, IEEE ComSoc and Springer are found automatically (special_issues.js).
  specialIssues: [],

  journals: [
    // AI & ML
    { name: "IEEE Transactions on Pattern Analysis and Machine Intelligence", short: "TPAMI", publisher: "IEEE", category: "ai", impact: 20.4, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=34" },
    { name: "IEEE Transactions on Knowledge and Data Engineering", short: "TKDE", publisher: "IEEE", category: "ai", impact: 11.6, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=69" },
    { name: "IEEE Transactions on Neural Networks and Learning Systems", short: "TNNLS", publisher: "IEEE", category: "ai", impact: 9.7, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=5962385" },
    { name: "Pattern Recognition", short: "", publisher: "Elsevier", category: "ai", impact: 9.1, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/pattern-recognition" },
    { name: "Neural Networks", short: "", publisher: "Elsevier", category: "ai", impact: 7.2, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/neural-networks" },
    { name: "Machine Learning", short: "", publisher: "Springer", category: "ai", impact: 4.9, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://link.springer.com/journal/10994" },
    { name: "IEEE Transactions on Artificial Intelligence", short: "TAI", publisher: "IEEE", category: "ai", impact: null, quartile: "Q1", index: ["Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=9078688" },
    { name: "Discover Artificial Intelligence", short: "", publisher: "Springer", category: "ai", impact: null, quartile: "Q1", index: ["Scopus"], access: "Open access", link: "https://link.springer.com/journal/44163" },

    // IoT & Cyber Security
    { name: "IEEE Transactions on Industrial Informatics", short: "TII", publisher: "IEEE", category: "security", impact: 9.8, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=9424" },
    { name: "IEEE Internet of Things Journal", short: "IoT-J", publisher: "IEEE", category: "security", impact: 8.7, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=6488907" },
    { name: "IEEE Transactions on Information Forensics and Security", short: "TIFS", publisher: "IEEE", category: "security", impact: 8.7, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=10206" },
    { name: "Internet of Things", short: "", publisher: "Elsevier", category: "security", impact: 7.6, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/internet-of-things" },
    { name: "IEEE Transactions on Dependable and Secure Computing", short: "TDSC", publisher: "IEEE", category: "security", impact: 6.8, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=8858" },
    { name: "Computers & Security", short: "", publisher: "Elsevier", category: "security", impact: 6.8, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/computers-and-security" },
    { name: "Future Generation Computer Systems", short: "FGCS", publisher: "Elsevier", category: "security", impact: 5.9, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/future-generation-computer-systems" },

    // Communications & Networking
    { name: "IEEE Communications Surveys & Tutorials", short: "COMST", publisher: "IEEE", category: "comm", impact: 50.6, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=9739" },
    { name: "IEEE Journal on Selected Areas in Communications", short: "JSAC", publisher: "IEEE", category: "comm", impact: 16.8, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=49" },
    { name: "IEEE Transactions on Wireless Communications", short: "TWC", publisher: "IEEE", category: "comm", impact: 10.3, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=7693" },
    { name: "IEEE Transactions on Mobile Computing", short: "TMC", publisher: "IEEE", category: "comm", impact: 8.8, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=7755" },
    { name: "IEEE Transactions on Parallel and Distributed Systems", short: "TPDS", publisher: "IEEE", category: "comm", impact: 5.9, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=71" },
    { name: "IEEE Transactions on Network and Service Management", short: "TNSM", publisher: "IEEE", category: "comm", impact: 5.7, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=4275028" },
    { name: "IEEE/ACM Transactions on Networking", short: "ToN", publisher: "IEEE / ACM", category: "comm", impact: 5.3, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=90" },
    { name: "Computer Networks", short: "", publisher: "Elsevier", category: "comm", impact: 4.7, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Hybrid", link: "https://www.sciencedirect.com/journal/computer-networks" },
    { name: "IEEE Access", short: "", publisher: "IEEE", category: "comm", impact: 4.2, quartile: "Q1", index: ["SCIE", "Scopus"], access: "Open access", link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=6287639" }
  ]
};
