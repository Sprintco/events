// Content for the Company, Safety, Legal and Help pages. Edit the text here; the pages render whatever is in this file.
// A card goes to `href`, or opens the support chat when `chat` is true.
export type Card = { title: string; desc: string; href?: string; chat?: boolean };
export type Section = {
  title: string;
  text?: string[];
  cards?: Card[];
  callout?: { text: string[]; link: { label: string; href: string } };
};
export type Hub = { eyebrow: string; title: string; intro: string; sections: Section[] };

export const HUBS: Record<string, Hub> = {
  company: {
    eyebrow: "AdultFriendFinder since 1996",
    title: "Company",
    intro:
      "This site has been online since 1996, and for a long stretch of that it barely changed. It is being rebuilt now, in the open, and everything below is either the story of why or a way to watch it happen.",
    sections: [
      {
        title: "What happened here",
        text: [
          "I built AdultFriendFinder in 1996 and sold it in 2007. It came out of that loaded with debt and spent most of the next fifteen years standing still. I bought the company back about five years ago. Money that used to go toward servicing that debt can go back to members instead, and I take no salary from it.",
          "In early 2026 I started rebuilding the site myself, page by page, from empty files. That work is still going, small fixes included.",
        ],
      },
      {
        title: "From Andrew",
        callout: {
          text: [
            "Hi, I'm Andrew. I started this site in 1996 and I'm rebuilding it now with member feedback.",
            "This site is an experiment: what happens when a site is owned by one person, and that person is a philanthropist? No outside pressure, just what members actually want.",
            "Tell me what's broken or what would make it better - I read what members send. The future will be interesting.",
          ],
          link: { label: "Who is Andrew? The longer story", href: "/info/about" },
        },
      },
      {
        title: "Follow along",
        cards: [
          { title: "What's new", desc: "Changes shipped recently, in plain language.", href: "/info/whats-new" },
          { title: "Blog", desc: "Longer notes on what is being built and why.", href: "/info/blog" },
          { title: "Feedback", desc: "Tell us what is broken or missing. Replies come back to you here.", chat: true },
        ],
      },
    ],
  },
  safety: {
    eyebrow: "Your account, your call",
    title: "Safety",
    intro:
      "Most of the safety controls on this site are already in your account. This page lists them and where each one lives. If someone is making you uncomfortable right now, start at the top.",
    sections: [
      {
        title: "If something is wrong right now",
        text: ["Blocking is immediate and the other member is not told. Reporting sends it to us."],
        cards: [
          { title: "Block someone", desc: "They cannot message you, see you in browse, or find your profile. Manage your list here.", href: "/info/block" },
          { title: "Report a member or a photo", desc: "Use Report in the menu on any profile, conversation, or broadcast. This is the policy behind it.", href: "/info/report-abuse" },
          { title: "Get an intimate image taken down", desc: "The removal request form for images shared without the consent of the person in them.", href: "/info/take-it-down" },
          { title: "Something urgent", desc: "Reach customer service directly rather than waiting on a report.", chat: true },
        ],
      },
      {
        title: "Staying safe",
        cards: [
          { title: "Dating safety", desc: "Tips for meeting people and attending events.", href: "/info/dating-safety" },
          { title: "Protect kids", desc: "How we keep minors off the site.", href: "/info/protect-kids" },
          { title: "Anti-trafficking", desc: "Our policy and how to report concerns.", href: "/info/anti-trafficking" },
        ],
      },
    ],
  },
  legal: {
    eyebrow: "Policies and notices",
    title: "Legal",
    intro:
      "Everything that governs your account, in one list. None of it is summarized here on purpose: each link opens the actual document, so what you read is what applies.",
    sections: [
      {
        title: "Start with these two",
        cards: [
          { title: "Privacy", desc: "What we collect, what we do with it, and the rights you have over it.", href: "/info/privacy" },
          { title: "Terms", desc: "The agreement between you and the site.", href: "/info/terms" },
        ],
      },
      {
        title: "Your privacy choices",
        text: ["Both of these change something about your account as soon as you use them."],
        cards: [
          { title: "Do Not Sell My Info", desc: "Your rights over the sale and sharing of your personal information, and how to exercise them.", href: "/info/do-not-sell" },
          { title: "Cookies", desc: "What we store in your browser and why.", href: "/info/cookies" },
        ],
      },
      {
        title: "Other notices",
        cards: [
          { title: "18 U.S.C. 2257", desc: "Record-keeping compliance statement.", href: "/info/2257" },
          { title: "Accessibility", desc: "Our commitment and how to tell us about a barrier.", href: "/info/accessibility" },
          { title: "Consent & Content Policy", desc: "What may be posted and how consent is handled.", href: "/info/consent-policy" },
          { title: "Complaints, Abuse Reporting & Content Removal Policy", desc: "How to file a complaint and what happens next.", href: "/info/complaints" },
          { title: "Take It Down Act Notice", desc: "How to request removal of non-consensual intimate images.", href: "/info/take-it-down" },
        ],
      },
    ],
  },
  help: {
    eyebrow: "Support",
    title: "Help",
    intro:
      "These are the things people write to us about most, in that order, and each one goes straight to the screen where you can sort it out yourself. If none of them is your problem, contact options are at the bottom of the page.",
    sections: [
      {
        title: "Handle it yourself",
        cards: [
          { title: "Cancel auto renewal", desc: "You can do this yourself in Billing. There is no phone call and no cancellation queue.", href: "/info/cancel-renewal" },
          { title: "Reset your password", desc: "Send yourself a reset link if you cannot sign in.", href: "/info/reset-password" },
          { title: "Stop emails you did not ask for", desc: "Choose which emails we send you, or switch them all off.", href: "/info/email-preferences" },
          { title: "Fix a photo that will not upload", desc: "Manage your albums, replace a photo, or check what is still waiting on review.", href: "/info/photo-upload" },
        ],
      },
      {
        title: "Reach someone here",
        cards: [
          { title: "Contact customer service", desc: "Billing, your account, anything that needs a person.", chat: true },
          { title: "Feedback", desc: "Tell us what is broken or missing. Replies come back to you here.", chat: true },
        ],
      },
    ],
  },
};
