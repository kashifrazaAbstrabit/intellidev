-- DropForeignKey
ALTER TABLE "ClientDeveloper" DROP CONSTRAINT "ClientDeveloper_client_id_fkey";

-- DropForeignKey
ALTER TABLE "ClientDeveloper" DROP CONSTRAINT "ClientDeveloper_developer_id_fkey";

-- AddForeignKey
ALTER TABLE "ClientDeveloper" ADD CONSTRAINT "ClientDeveloper_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDeveloper" ADD CONSTRAINT "ClientDeveloper_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
