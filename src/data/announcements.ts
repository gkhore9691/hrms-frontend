export interface Announcement {
  id: string;
  title: string;
  date: string;
  body: string;
  pinned?: boolean;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Office closed for Republic Day",
    date: "2025-01-20",
    body: "The office will remain closed on 26 January (Republic Day). All employees are requested to mark the day in the holiday calendar. Wishing everyone a happy Republic Day!",
    pinned: true,
  },
  {
    id: "a2",
    title: "New wellness program launch",
    date: "2025-01-15",
    body: "HR is launching a wellness program from February. This includes gym reimbursement, mental health support, and annual health check-ups. Details will be shared via email.",
    pinned: true,
  },
  {
    id: "a3",
    title: "Annual performance cycle 2025",
    date: "2025-01-10",
    body: "The annual performance cycle for 2025 will run from 1 Feb to 31 Mar. Goals should be set by 15 Feb. Please complete self-reviews by 20 Mar. Managers will share review timelines.",
  },
  {
    id: "a4",
    title: "IT policy update",
    date: "2025-01-05",
    body: "Updated IT and data security policy is now live. All employees must acknowledge the policy in Onboarding by 31 Jan. Contact IT helpdesk for any queries.",
  },
  {
    id: "a5",
    title: "Festival advance and bonus",
    date: "2024-12-20",
    body: "Festival advance requests for the upcoming season can be submitted via the payroll team by 5 Jan. Eligibility and limits are as per the policy document on the intranet.",
  },
];
