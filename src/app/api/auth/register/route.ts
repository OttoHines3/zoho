import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as {
      name: string;
      email: string;
      password: string;
    };
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
