import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Shield,
} from "lucide-react";

type InfoItem = {
  title: string;
  body: string;
};

const PageContainer = ({ children }: { children: React.ReactNode }) => (
  <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
    {children}
  </main>
);

const Hero = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm shadow-black/20 sm:p-8">
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary/90">
      Treesh
    </p>
    <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
      {title}
    </h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
      {subtitle}
    </p>
  </header>
);

const Surface = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 transition-colors duration-300 hover:bg-slate-900/70 sm:p-6">
    {children}
  </section>
);

const LegalArticle = ({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) => (
  <article className="rounded-xl border border-slate-800/80 bg-slate-950/45 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/65">
    <div className="flex items-start gap-4">
      <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {index}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
      </div>
    </div>
  </article>
);

export const AboutPage = () => {
  const pillars: InfoItem[] = [
    {
      title: "Human-first social experience",
      body: "Treesh is built to prioritize real conversations over noisy engagement loops. We design for trust, clarity, and healthy interaction.",
    },
    {
      title: "Safety by design",
      body: "Account protection, moderation workflows, and reporting tools are integrated into daily product behavior instead of being hidden settings.",
    },
    {
      title: "Unified content platform",
      body: "From posts and stories to live interactions, users can share moments in one cohesive space without fragmented flows.",
    },
  ];

  return (
    <PageContainer>
      <Hero
        title="About Us"
        subtitle="Treesh helps people build meaningful digital communities through sharing, streaming, and conversation in one consistent experience."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <Surface>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Our Mission
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Build a platform where people can express themselves freely, connect safely, and discover communities that add value to everyday life.
          </p>
        </Surface>
        <Surface>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <Eye className="h-5 w-5 text-primary" />
            Our Vision
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Set a modern standard for social products where transparency, privacy, and respectful interaction are core product features.
          </p>
        </Surface>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/70"
          >
            <h3 className="text-base font-semibold text-slate-100">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{pillar.body}</p>
          </article>
        ))}
      </section>

      <Surface>
        <h2 className="text-lg font-semibold text-slate-100">Get Treesh</h2>
        <p className="mt-2 text-sm text-slate-300">
          Install Treesh on your preferred device and stay connected everywhere.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button className="bg-primary text-white hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download for iOS
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download for Android
          </Button>
        </div>
      </Surface>
    </PageContainer>
  );
};

export const TermsPage = () => {
  const terms: InfoItem[] = [
    {
      title: "Acceptance of terms",
      body: "By creating an account or using Treesh, you agree to these terms and all related policies. If you do not agree, please discontinue use.",
    },
    {
      title: "Account responsibility",
      body: "You are responsible for your login credentials and all activity under your account. Keep your credentials secure and notify support for suspicious access.",
    },
    {
      title: "User content",
      body: "You retain ownership of what you post. You grant Treesh a limited license to display and distribute content to operate platform features.",
    },
    {
      title: "Acceptable behavior",
      body: "Harassment, hateful conduct, impersonation, and illegal activity are prohibited. Violations may lead to content removal or account suspension.",
    },
    {
      title: "Service availability",
      body: "We continuously improve Treesh and may update features, availability, or technical requirements. Scheduled maintenance may affect access temporarily.",
    },
    {
      title: "Limitation of liability",
      body: "Treesh is provided as available. To the extent allowed by law, we are not liable for indirect or consequential losses from service use.",
    },
    {
      title: "Termination",
      body: "We may suspend or terminate accounts that violate these terms. Users may close their account through settings or by contacting support.",
    },
    {
      title: "Policy updates",
      body: "We may revise these terms as the product evolves. Material updates will be posted clearly, and continued use indicates acceptance.",
    },
  ];

  return (
    <PageContainer>
      <Hero
        title="Terms & Conditions"
        subtitle="Clear rules that help keep Treesh reliable, respectful, and safe for everyone."
      />

      <section className="space-y-3" aria-label="Terms sections">
        {terms.map((term, index) => (
          <LegalArticle
            key={term.title}
            index={index + 1}
            title={term.title}
            body={term.body}
          />
        ))}
      </section>
    </PageContainer>
  );
};

export const PrivacyPage = () => {
  const privacy: InfoItem[] = [
    {
      title: "What we collect",
      body: "We collect account details, profile information, and activity data needed to deliver platform functionality and improve product quality.",
    },
    {
      title: "How we use data",
      body: "Your information helps us power feeds, protect accounts, personalize relevant content, and provide customer support.",
    },
    {
      title: "Security controls",
      body: "We apply technical and operational safeguards, including access controls and monitoring, to reduce unauthorized data exposure risks.",
    },
    {
      title: "Cookies and similar tech",
      body: "Cookies and local storage support login continuity, preferences, and performance analytics. You can manage cookie behavior in browser settings.",
    },
    {
      title: "Data sharing",
      body: "We do not sell personal information. Limited sharing may occur with trusted processors or when required by law.",
    },
    {
      title: "Your choices",
      body: "You can request access, correction, or deletion of your data subject to legal obligations and platform security requirements.",
    },
    {
      title: "Children and age limits",
      body: "Treesh is intended for users who meet applicable minimum age requirements. We do not knowingly collect data from underage users.",
    },
    {
      title: "Contact for privacy",
      body: "For privacy-related requests, contact our team through the Support page and include enough detail for secure verification.",
    },
  ];

  return (
    <PageContainer>
      <Hero
        title="Privacy Policy"
        subtitle="A plain-language summary of how Treesh handles personal data and protects user trust."
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Private by default</h2>
          </div>
          <p className="mt-2 text-sm text-slate-300">Sensitive operations require explicit user action and protected access.</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Security-focused</h2>
          </div>
          <p className="mt-2 text-sm text-slate-300">Platform controls are continuously reviewed to reduce abuse and risk.</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Transparent</h2>
          </div>
          <p className="mt-2 text-sm text-slate-300">We explain data use in human-friendly language, not legal jargon.
          </p>
        </article>
      </section>

      <section className="space-y-3" aria-label="Privacy sections">
        {privacy.map((item, index) => (
          <LegalArticle
            key={item.title}
            index={index + 1}
            title={item.title}
            body={item.body}
          />
        ))}
      </section>
    </PageContainer>
  );
};

export const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missingField = Object.values(formData).some((value) => !value.trim());
    if (missingField) {
      toast({
        title: "Please complete all fields",
        description: "Name, email, subject, and message are required.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Support request submitted",
      description: "A member of our team will respond shortly.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <PageContainer>
      <Hero
        title="Support & Help"
        subtitle="Need help with account access, billing, or safety concerns? Reach our team through the channels below."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/55 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/75">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Mail className="h-4 w-4 text-primary" />
            Email Support
          </h2>
          <p className="mt-2 text-sm text-slate-300">Best for detailed issues and screenshots.</p>
          <a href="mailto:support@treesh.com" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80">
            support@treesh.com
          </a>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/55 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/75">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Phone className="h-4 w-4 text-primary" />
            Phone
          </h2>
          <p className="mt-2 text-sm text-slate-300">Available Monday to Friday for urgent account help.</p>
          <a href="tel:+1800873374" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80">
            +1 (800) 873-374
          </a>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/55 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/75">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <MessageSquare className="h-4 w-4 text-primary" />
            Live Chat
          </h2>
          <p className="mt-2 text-sm text-slate-300">Fastest route for general guidance and troubleshooting.</p>
          <button
            onClick={() => toast({ title: "Chat launching", description: "Live chat will open in this session." })}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            Start chat <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Send us a message</h2>
          <p className="mt-2 text-sm text-slate-300">Use this form for support requests, account questions, and platform feedback.</p>
        </header>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="support-name" className="mb-1.5 block text-sm font-medium text-slate-200">Full name</label>
              <input
                id="support-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="support-email" className="mb-1.5 block text-sm font-medium text-slate-200">Email address</label>
              <input
                id="support-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                placeholder="name@email.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="support-subject" className="mb-1.5 block text-sm font-medium text-slate-200">Subject</label>
            <input
              id="support-subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              placeholder="What can we help with?"
            />
          </div>
          <div>
            <label htmlFor="support-message" className="mb-1.5 block text-sm font-medium text-slate-200">Message</label>
            <textarea
              id="support-message"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full resize-none rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              placeholder="Share details so we can help quickly."
            />
          </div>
          <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
            Submit request
          </Button>
        </form>
      </section>

      <section className="mt-4">
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Quick answers</h2>
        <div className="space-y-2">
          {[
            {
              q: "How do I reset my password?",
              a: "Use the Forgot Password option on the login screen. You will receive a secure reset flow via your registered email.",
            },
            {
              q: "How do I report abuse or harmful content?",
              a: "Use the report action available on posts, profiles, and messages. Our moderation team reviews high-risk reports with priority.",
            },
            {
              q: "How long do support responses usually take?",
              a: "Most requests are answered within 24 hours. Safety and account access issues are handled faster whenever possible.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors duration-300 hover:bg-slate-900/70"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-100">
                {item.q}
                <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageContainer>
  );
};