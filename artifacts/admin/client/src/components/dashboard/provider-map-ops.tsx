"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import type { Provider } from "@/lib/types";
import { VerificationStatus } from "@/lib/types";
import { fetchProviders } from "@/lib/api";
import "leaflet/dist/leaflet.css";

type ProviderMapOpsProps = {
  height?: number;
};

const DEFAULT_CENTER: LatLngExpression = [-15.7801, -47.9292];
const DEFAULT_ZOOM_LEVEL = 5;

const MapContainerComponent = MapContainer as unknown as React.ComponentType<any>;
const TileLayerComponent = TileLayer as unknown as React.ComponentType<any>;
const MarkerComponent = Marker as unknown as React.ComponentType<any>;
const PopupComponent = Popup as unknown as React.ComponentType<any>;

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveProviderFullName = (provider: Provider) =>
  provider.fullName || provider.name || "Sem nome";

const resolveProviderCoordinates = (
  provider: Provider
): { lat: number; lng: number } | null => {
  const providerWithLast = provider as Provider & {
    lastLat?: number | string;
    lastLng?: number | string;
  };
  const lat = toNumber(providerWithLast.lastLat ?? provider.latitude ?? provider.address?.latitude);
  const lng = toNumber(providerWithLast.lastLng ?? provider.longitude ?? provider.address?.longitude);
  return lat === null || lng === null ? null : { lat, lng };
};

const createMarkerIcon = (color: string, pulsing = false): L.DivIcon => {
  const pulseRing = pulsing
    ? `<span style="position:absolute; inset:-5px; border-radius:999px; border:2px solid ${color}; animation: opsPulse 1.8s ease-out infinite;"></span>`
    : "";
  const animationStyle = pulsing
    ? `<style>
        @keyframes opsPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { opacity: 0; }
        }
      </style>`
    : "";

  return L.divIcon({
    className: "",
    html: `
      <span style="position:relative; display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px;">
        ${pulseRing}
        <span style="width:12px; height:12px; border-radius:999px; background:${color}; box-shadow:0 0 10px ${color}66;"></span>
      </span>
      ${animationStyle}
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

const approvedMarkerIcon = createMarkerIcon("#16a34a", true);
const pendingMarkerIcon = createMarkerIcon("#f59e0b", false);
const blockedMarkerIcon = createMarkerIcon("#dc2626", false);

const resolveMarkerIcon = (status: VerificationStatus) => {
  if (status === VerificationStatus.APPROVED) return approvedMarkerIcon;
  if (status === VerificationStatus.REJECTED || status === VerificationStatus.BLOCKED) return blockedMarkerIcon;
  return pendingMarkerIcon;
};

export default function ProviderMapOps({ height = 320 }: ProviderMapOpsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: providers = [], isLoading, isError } = useQuery<Provider[], Error>({
    queryKey: ["/providers"],
    queryFn: fetchProviders,
  });

  const filteredProviders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !normalizedSearch ||
        resolveProviderFullName(provider).toLowerCase().includes(normalizedSearch) ||
        (provider.city || provider.address?.city || "").toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || provider.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [providers, searchTerm, statusFilter]);

  const providerPoints = useMemo(() => {
    return filteredProviders
      .map((provider) => {
        const coords = resolveProviderCoordinates(provider);
        if (!coords) return null;
        return {
          provider,
          coords,
          icon: resolveMarkerIcon(provider.verificationStatus),
        };
      })
      .filter(Boolean) as {
      provider: Provider;
      coords: { lat: number; lng: number };
      icon: L.DivIcon;
    }[];
  }, [filteredProviders]);

  const approvedCount = providers.filter(
    (provider) => provider.verificationStatus === VerificationStatus.APPROVED
  ).length;

  return (
    <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-950">Mapa operacional</h3>
            <Badge className="border-0 bg-emerald-100 px-2 py-0 text-[10px] font-semibold text-emerald-700">
              {providerPoints.length} no mapa
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            ONGs, clinicas e status de cobertura em tempo real.
          </p>
        </div>

        <div className="flex min-w-0 flex-1 gap-2 xl:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar rede ou cidade"
              className="h-9 rounded-xl border-gray-200 pl-9 text-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40 rounded-xl text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value={VerificationStatus.APPROVED}>Aprovados</SelectItem>
              <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>Pendentes</SelectItem>
              <SelectItem value={VerificationStatus.REJECTED}>Reprovados</SelectItem>
              <SelectItem value={VerificationStatus.BLOCKED}>Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative bg-slate-100" style={{ height }}>
        <MapContainerComponent
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM_LEVEL}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayerComponent
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {providerPoints.map(({ provider, coords, icon }) => {
            const providerFullName = resolveProviderFullName(provider);
            const city = provider.city ?? provider.address?.city;

            return (
              <MarkerComponent
                key={provider.id}
                position={[coords.lat, coords.lng]}
                icon={icon}
              >
                <PopupComponent className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p className="text-sm font-semibold text-gray-900">{providerFullName}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">
                      {provider.verificationStatus.replace(/_/g, " ")}
                    </p>
                    {city && (
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="mr-1 h-3 w-3" /> {city}
                      </Badge>
                    )}
                  </div>
                </PopupComponent>
              </MarkerComponent>
            );
          })}
        </MapContainerComponent>

        <div className="absolute bottom-3 left-3 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {approvedCount} aprovados
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {providers.length - approvedCount} em revisao
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-600">
            Carregando rede operacional...
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-red-600">
            Erro ao carregar rede operacional.
          </div>
        )}
        {!isLoading && !isError && providerPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-600">
            Nenhuma ONG ou clinica encontrada para os filtros atuais.
          </div>
        )}
      </div>
    </Card>
  );
}
