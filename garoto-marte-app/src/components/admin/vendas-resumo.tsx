"use client";

import React, { useEffect, useState } from 'react';
import { getResumoVendas } from '../../lib/services/vendas';
import { Card } from "@/components/ui/card";

export default function VendasResumo() {
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResumo() {
      setLoading(true);
      setError(null);
      try {
        const data = await getResumoVendas();
        setResumo(data);
      } catch (err: any) {
        setError('Erro ao carregar resumo das vendas');
      } finally {
        setLoading(false);
      }
    }
    fetchResumo();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Resumo das Vendas</h2>
        {loading ? (
          <div className="text-gray-500">Carregando resumo...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : !resumo ? (
          <div className="text-gray-500">Nenhum dado encontrado.</div>
        ) : (
          <ul className="space-y-1 text-base text-gray-800">
            <li>Total de vendas: <b>{resumo.totalVendas}</b></li>
            <li>Vendas aprovadas: <b>{resumo.vendasAprovadas}</b></li>
            <li>Vendas pendentes: <b>{resumo.vendasPendentes}</b></li>
            <li>Vendas canceladas: <b>{resumo.vendasCanceladas}</b></li>
            <li>Faturamento total: <b>R$ {resumo.faturamentoTotal?.toFixed(2)}</b></li>
          </ul>
        )}
      </div>
    </Card>
  );
}
