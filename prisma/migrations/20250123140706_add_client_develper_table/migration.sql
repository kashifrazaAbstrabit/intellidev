-- CreateTable
CREATE TABLE "ClientDeveloper" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "developer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDeveloper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientDeveloper_client_id_developer_id_key" ON "ClientDeveloper"("client_id", "developer_id");

-- AddForeignKey
ALTER TABLE "ClientDeveloper" ADD CONSTRAINT "ClientDeveloper_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDeveloper" ADD CONSTRAINT "ClientDeveloper_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
