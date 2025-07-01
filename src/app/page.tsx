import { redirect } from "next/navigation";

import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default function Home() {
  redirect("/signin");
  return null;
}
