import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.marketplacelisting.findMany({
      include: {
        businessprofile: {
          select: {
            businessName: true,
            category: true,
            location: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch marketplace products:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, price, category, authorId } = await request.json();

    if (!title || !description || !price || !category || !authorId) {
      return NextResponse.json({ 
        error: "Missing required fields",
        details: { 
          title: !title, 
          description: !description, 
          price: !price, 
          category: !category, 
          authorId: !authorId 
        }
      }, { status: 400 });
    }

    // Verify business profile exists
    const businessProfile = await prisma.businessprofile.findUnique({
      where: { userId: authorId },
      select: { id: true }
    });

    if (!businessProfile) {
      return NextResponse.json({ 
        error: "Business profile not found",
        details: "You need to create a business profile first"
      }, { status: 404 });
    }

    // Generate a unique ID for the new listing
    const listingId = `ml_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      // First create the marketplace listing
      await prisma.marketplacelisting.create({
        data: {
          id: listingId,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category: category.trim(),
          authorId: businessProfile.id, // This is the business profile ID
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Then fetch the complete product with relations
      const productWithRelations = await prisma.marketplacelisting.findUnique({
        where: { id: listingId },
        include: {
          businessprofile: {
            select: {
              id: true,
              businessName: true,
              category: true,
              location: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Product created successfully",
        data: productWithRelations
      }, { status: 201 });

    } catch (error) {
      console.error("Error creating marketplace listing:", error);
      return NextResponse.json(
        { error: "Failed to create marketplace listing" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Failed to create marketplace product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
