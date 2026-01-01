import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Route for journal attachments (images)
    journalImage: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 10,
        },
    })
        .middleware(async () => {
            // Check authentication
            const session = await auth();

            if (!session?.user?.id) {
                throw new Error("Unauthorized");
            }

            // Return metadata to be stored with the file
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);

            // Return data to the client
            return {
                userId: metadata.userId,
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
            };
        }),

    // Route for profile images
    profileImage: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const session = await auth();

            if (!session?.user?.id) {
                throw new Error("Unauthorized");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Profile image upload complete for userId:", metadata.userId);

            return {
                userId: metadata.userId,
                url: file.ufsUrl,
            };
        }),

    // Route for general file uploads (future use)
    generalFile: f({
        image: { maxFileSize: "4MB", maxFileCount: 5 },
        pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    })
        .middleware(async () => {
            const session = await auth();

            if (!session?.user?.id) {
                throw new Error("Unauthorized");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                userId: metadata.userId,
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                type: file.type,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
