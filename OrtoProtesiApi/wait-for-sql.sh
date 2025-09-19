echo "Aspetto SQL Server (db:1433)..."
until /opt/mssql-tools/bin/sqlcmd -S db,1433 -U sa -P ${MSSQL_SA_PASSWORD} -Q "SELECT 1" &>/dev/null
do
  sleep 2
done
echo "SQL Server disponibile dopo ${SECONDS} secondi."
dotnet OrtoProtesiApi.dll
