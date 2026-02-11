-- CreateTable
CREATE TABLE "CustomSizeSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerVariant" TEXT NOT NULL,
    "imageUrl" TEXT,
    "displayStyle" TEXT NOT NULL DEFAULT 'MODAL',
    "noteTitle" TEXT,
    "noteContent" TEXT,
    "reqNearestSize" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomSizeField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "setId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CustomSizeField_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CustomSizeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
