"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("taskconnect_user");
    if (!saved) {
      router.push("/leader/login");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const roleLower = (parsed.role || "").toLowerCase();
      const typeLower = (parsed.type || "").toLowerCase();
      const emailLower = (parsed.email || "").toLowerCase();

      const isClient =
        typeLower === "client" ||
        roleLower.includes("client") ||
        emailLower.includes("client");

      const isTeam =
        !isClient &&
        (typeLower === "team" ||
          roleLower.includes("team") ||
          roleLower.includes("developer") ||
          roleLower.includes("member") ||
          emailLower.includes("member"));

      if (isClient) {
        router.push("/client/team");
      } else if (isTeam) {
        router.push("/member/team");
      } else {
        router.push("/leader/team");
      }
    } catch (e) {
      router.push("/leader/login");
    }
  }, [router]);

  return null;
}
