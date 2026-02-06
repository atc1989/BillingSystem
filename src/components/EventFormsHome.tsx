import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardCheck, FileText, Users, type LucideIcon } from "lucide-react";
import { cn } from "./ui/utils";

type FormTone = "blue" | "green" | "purple";

type FormCardItem = {
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  tone: FormTone;
};

const formCards: FormCardItem[] = [
  {
    title: "Special Company Events",
    subtitle: "Flow Checklist (with speaker)",
    to: "/forms/special-company-events",
    icon: ClipboardCheck,
    tone: "blue",
  },
  {
    title: "Event Request",
    subtitle: "Complete event request form",
    to: "/forms/event-request",
    icon: FileText,
    tone: "green",
  },
  {
    title: "Prospect Invitation",
    subtitle: "Track guest invitations",
    to: "/forms/prospect-invitation",
    icon: Users,
    tone: "purple",
  },
];

const toneStyles: Record<FormTone, { icon: string; iconBg: string }> = {
  blue: { icon: "text-blue-600", iconBg: "bg-blue-100/80" },
  green: { icon: "text-green-600", iconBg: "bg-green-100/80" },
  purple: { icon: "text-purple-600", iconBg: "bg-purple-100/80" },
};

type FormCardProps = FormCardItem & {
  isActive: boolean;
};

function FormCard({ title, subtitle, to, icon: Icon, tone, isActive }: FormCardProps) {
  const styles = toneStyles[tone];

  return (
    <Link
      to={to}
      className={cn(
        "group bg-white border rounded-2xl px-6 py-10 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40",
        isActive ? "border-green-500 shadow-md" : "border-gray-200",
      )}
      aria-current={isActive ? \"page\" : undefined}
    >
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
          styles.iconBg,
        )}
      >
        <Icon className={cn("h-7 w-7", styles.icon)} />
      </div>
      <div className="mt-5 text-lg font-semibold text-gray-900">{title}</div>
      <div className="mt-2 text-sm text-gray-600">{subtitle}</div>
    </Link>
  );
}

export function EventFormsHome() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Event Forms</h1>
            <p className="text-gray-600 mt-1">
              Choose a form to get started with your event requests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formCards.map((card) => (
              <FormCard
                key={card.title}
                {...card}
                isActive={location.pathname.startsWith(card.to)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
