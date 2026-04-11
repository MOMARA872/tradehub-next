"use client";

import { useState } from "react";
import { RESUMES } from "@/lib/data/resumes";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function ResumesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const publicResumes = RESUMES.filter((r) => r.isPublic);

  const availabilityStyle = (availability: string) => {
    if (availability === "Available Now") {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    }
    if (availability === "Open to Opportunities") {
      return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    }
    return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Resumes &amp; Service Profiles
        </h1>
        <Link
          href="/resumes/new"
          className="flex items-center gap-2 bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Create Resume
        </Link>
      </div>

      {publicResumes.length === 0 ? (
        <EmptyState
          message="No public resumes yet. Be the first to create one!"
          icon="&#x1f4c4;"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {publicResumes.map((resume) => {
            const user = null as (User | null);
            const isExpanded = expandedId === resume.id;
            const visibleSkills = resume.skills.slice(0, 5);
            const remainingSkills = resume.skills.length - 5;

            return (
              <div
                key={resume.id}
                className={`bg-card border rounded-[var(--radius-md)] overflow-hidden transition-all cursor-pointer ${
                  isExpanded
                    ? "border-brand/40 ring-1 ring-brand/20 col-span-1 md:col-span-2 lg:col-span-3"
                    : "border-border hover:border-brand/30"
                }`}
                onClick={() =>
                  setExpandedId(isExpanded ? null : resume.id)
                }
              >
                <div className="p-5">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar user={user} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-foreground text-sm truncate">
                        {resume.name}
                      </h3>
                      {user?.city && (
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3 w-3" />
                          <span>{user.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Headline */}
                  <p className="text-sm font-medium text-foreground mb-2">
                    {resume.headline}
                  </p>

                  {/* Summary (truncated when collapsed) */}
                  <p className="text-sm text-muted mb-3 leading-relaxed">
                    {isExpanded
                      ? resume.summary
                      : resume.summary.length > 120
                        ? resume.summary.slice(0, 120) + "..."
                        : resume.summary}
                  </p>

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(isExpanded ? resume.skills : visibleSkills).map(
                      (skill) => (
                        <span
                          key={skill}
                          className="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      )
                    )}
                    {!isExpanded && remainingSkills > 0 && (
                      <span className="text-[11px] bg-surface2 text-muted px-2 py-0.5 rounded-full">
                        +{remainingSkills} more
                      </span>
                    )}
                  </div>

                  {/* Availability & Desired Role */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${availabilityStyle(
                        resume.availability
                      )}`}
                    >
                      <Clock className="h-3 w-3" />
                      {resume.availability}
                    </span>
                    <span className="text-xs text-muted">
                      {resume.desiredRole}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-6">
                    {/* Experience Timeline */}
                    {resume.experience.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground mb-3">
                          <Briefcase className="h-4 w-4 text-brand" />
                          Experience
                        </h4>
                        <div className="space-y-4 pl-6 border-l-2 border-brand/20">
                          {resume.experience.map((exp, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-brand" />
                              <p className="font-medium text-sm text-foreground">
                                {exp.title}
                              </p>
                              <p className="text-xs text-muted">
                                {exp.company} &middot; {exp.period}
                              </p>
                              <p className="text-sm text-muted mt-1">
                                {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {resume.education.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground mb-3">
                          <GraduationCap className="h-4 w-4 text-purple-400" />
                          Education
                        </h4>
                        <div className="space-y-2.5">
                          {resume.education.map((edu, i) => (
                            <div key={i}>
                              <p className="font-medium text-sm text-foreground">
                                {edu.degree}
                              </p>
                              <p className="text-xs text-muted">
                                {edu.school} &middot; {edu.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
