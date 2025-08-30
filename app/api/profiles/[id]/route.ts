import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Define the expected parameter type
type RouteParams = {
  params: {
    id: string;
  };
};

// Define the route handler type
type RouteHandler = (
  request: Request,
  context: RouteParams
) => Promise<Response> | Response;

// GET /api/profiles/[id]
export const GET: RouteHandler = async (
  request: Request,
  { params }
) => {
  const { id } = params;
  try {
    const profile = await prisma.businessprofile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        marketplacelisting: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            category: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const response = NextResponse.json(profile);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/profiles/[id]
export const PATCH: RouteHandler = async (
  request: Request,
  { params }
) => {
  const { id } = params;
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const profile = await prisma.businessprofile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.user.id !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden - You can only update your own profile" }, { status: 403 });
    }

    const data = await request.json();

    const updatedProfile = await prisma.businessprofile.update({
      where: { id },
      data: {
        businessName: data.businessName ?? profile.businessName,
        description: data.description ?? profile.description,
        category: data.category ?? profile.category,
        location: data.location ?? profile.location,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]
export const DELETE: RouteHandler = async (
  request: Request,
  { params }
) => {
  const { id } = params;
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const profile = await prisma.businessprofile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.user.id !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden - You can only delete your own profile" }, { status: 403 });
    }

    await prisma.businessprofile.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
