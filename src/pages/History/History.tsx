import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHistory } from "../../services/api";
import colors from "../../constants/colors";
import Text from "../../components/commons/Text";
import Section from "../../components/commons/Section";
import { timeAgo } from "../../utils/helpers";
import PageHeader from "../../components/commons/PageHeader";
import ExportPreviewModal from "../../components/export/ExportPreviewModal";
import { toCsv, downloadTextFile } from "../../utils/exportCsv";
import { buildHistoryPdf } from "../../utils/exportPdf";
import { SENSOR_TYPES } from "../../utils/constants";
import ImportModal from "../../components/import/ImportModal";
import { getUnitOptions, convertValue, getCalibrationStatus, type SensorType as UnitSensorType } from "../../utils/unitConversion";
import cssStyles from "./History.module.css";
import { useGenerateImage } from "recharts-to-png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

function DateRangeInput({
    value,
    min,
    max,
    onChange,
}: {
    value: string;
    min?: string;
    max?: string;
    onChange: (value: string) => void;
    ariaLabel?: string;
}) {
    const date = value ? new Date(value + "T12:00:00.000Z") : null;
    const minDate = min ? new Date(min + "T00:00:00.000Z") : undefined;
    const maxDate = max ? new Date(max + "T23:59:59.999Z") : undefined;
    return (
        <DatePicker
            selected={date}
            onChange={(d: Date | null) => onChange(d ? d.toISOString().slice(0, 10) : value)}
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="yyyy-MM-dd"
            className={cssStyles.dateInput}
            wrapperClassName={cssStyles.datePickerWrapper}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            placeholderText="Select date"
        />
    );
}

export default function History() {
    const [searchParams, setSearchParams] = useSearchParams();
    // data
    const [data, setData] = useState<any>(null);
    const [metaData, setMetaData] = useState<any>(null);
    const [, setError] = useState<any>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [exportBusy, setExportBusy] = useState(false);
    const [exportRows, setExportRows] = useState<any[] | null>(null);
    const [exportErr, setExportErr] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<{ pages: number; rows: number } | null>(null);
    // pagination
    const [pageInfo, setPageInfo] = useState<any>(null);
    const [cursor, setCursor] = useState<any>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [getExportChartPng, { ref: exportChartRef, isLoading: exportPngLoading }] =
        useGenerateImage<HTMLDivElement>({
            options: { backgroundColor: "#FFFFFF", scale: 2 } as any,
            type: "image/png",
        });
    

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const sensorLabel = (SENSOR_TYPES as Record<string, { label: string }>)[sensorType]?.label ?? sensorType;
    const endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate')
        ?? new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = Number(searchParams.get('limit')) || 10;

    // Unit conversion state
    const sourceUnit = metaData?.unit ?? (SENSOR_TYPES as Record<string, { unit: string }>)[sensorType]?.unit ?? '';
    const [selectedUnit, setSelectedUnit] = useState<string>(sourceUnit);
    const unitOptions = getUnitOptions(sensorType as UnitSensorType, sourceUnit);
    const calibrationStatus = getCalibrationStatus();

    // Draft date state — only committed to URL (and triggers fetch) when "Set Dates" is clicked
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    const setDateRange = (from: string, to: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('startDate', from);
            next.set('endDate', to);
            return next;
        });
    };

    const fetchAllForExport = async () => {
        setExportBusy(true);
        setExportErr(null);
        setExportProgress({ pages: 0, rows: 0 });
        try {
            let all: any[] = [];
            let nextCursor: string = '';
            const pageLimit = 200;
            // safety cap
            const MAX_EXPORT_ROWS = 20000;

            while (true) {
                const res = await getHistory({
                    sensorType,
                    startDate,
                    endDate,
                    limit: pageLimit,
                    cursor: nextCursor,
                });

                if (res.error) {
                    throw new Error(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
                }

                const page = res.data ?? [];
                all = [...all, ...page];
                setExportProgress((prev) => ({
                    pages: (prev?.pages ?? 0) + 1,
                    rows: all.length,
                }));

                if (!res.pageInfo?.hasNext || !res.pageInfo?.nextCursor) break;
                if (all.length >= MAX_EXPORT_ROWS) break;

                nextCursor = res.pageInfo.nextCursor;
            }

            setExportRows(all);
            return all;
        } catch (e: any) {
            setExportErr(e?.message || 'Failed to prepare export');
            setExportRows(null);
            return null;
        } finally {
            setExportBusy(false);
        }
    };

    const exportDisabled = !data || data.length === 0;
    const exportTitle = `History: ${metaData?.sensorType ?? sensorType}`;
    const exportFilenameBase = `history_${sensorType}_${startDate}_${endDate}`;

    const handleOpenExport = () => {
        setExportOpen(true);
        setExportRows(null);
        setExportErr(null);
        setExportProgress(null);
        void fetchAllForExport();
    };

    const handleDownloadHistoryCsv = async () => {
        const rows = exportRows ?? (await fetchAllForExport());
        if (!rows || !rows.length) return;
        
        // Convert values to selected unit for export
        const convertedRows = rows.map((r: any) => ({
            ...r,
            value: typeof r.value === 'number' ? convertDisplayValue(r.value) : r.value,
            unit: selectedUnit,
        }));
        
        const csv = toCsv(convertedRows as any, ['recordedAt', 'value', 'unit', '_id']);
        downloadTextFile(`${exportFilenameBase}.csv`, 'text/csv', csv);
    };

    const handleDownloadHistoryJson = async () => {
        const rows = exportRows ?? (await fetchAllForExport());
        if (!rows || !rows.length) return;
        const payload = rows.map((r: any) => ({
            recordedAt: typeof r.recordedAt === 'string' ? r.recordedAt : new Date(r.recordedAt).toISOString(),
            value: typeof r.value === 'number' ? convertDisplayValue(r.value) : r.value,
            unit: selectedUnit,
            _id: r._id,
        }));
        downloadTextFile(`${exportFilenameBase}.json`, 'application/json', JSON.stringify(payload, null, 2));
    };

    const handleDownloadHistoryPdf = async () => {
        const rows = exportRows ?? (await fetchAllForExport());
        if (!rows || !rows.length) return;
        const chartPng = await getExportChartPng();
        
        // Convert values to selected unit for PDF export
        const convertedRows = rows.map((r: any) => ({
            recordedAt: r.recordedAt,
            value: typeof r.value === 'number' ? convertDisplayValue(r.value) : r.value,
            _id: r._id,
        }));
        
        const doc = buildHistoryPdf({
            title: exportTitle,
            startDate,
            endDate,
            unit: selectedUnit,
            chartPngDataUrl: chartPng,
            rows: convertedRows,
        });
        doc.save(`${exportFilenameBase}.pdf`);
    };

    // Reset draft dates to committed URL dates when sensor type changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType]);

    // Reset selected unit when source unit changes (e.g., when switching sensors)
    useEffect(() => {
        setSelectedUnit(sourceUnit);
    }, [sourceUnit]);

    // Helper function to convert a value from source unit to selected unit
    const convertDisplayValue = (value: number): number => {
        if (!sourceUnit || !selectedUnit) return value;
        return convertValue({
            sensorType: sensorType as UnitSensorType,
            value,
            sourceUnit,
            targetUnit: selectedUnit,
        });
    };

    const init = async () => {
        if (!startDate || !endDate) return;
        const res = await getHistory({ sensorType, startDate, endDate, limit, cursor });

        if (res.error) {
            setData(null);
            setPageInfo(null);
            setError(res.error);
            console.error(res.error);
        }

        setData(res.data);
        setMetaData(res.meta);
        setPageInfo(res.pageInfo);
    }

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, startDate, endDate, limit]);

    // pagination logic
    const fetchMore = async () => {
        if (!pageInfo?.hasNext) return;
        const res = await getHistory({ sensorType, startDate, endDate, limit, cursor: pageInfo?.nextCursor || '' });

        if (res.error) {
            setData(null);
            setPageInfo(null);
            setError(res.error);
            console.error(res.error);
        }

        setData((prev: any) => [...prev, ...res.data]);
        setMetaData(res.meta);
        setPageInfo(res.pageInfo);
    }

    useEffect(() => {
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    fetchMore();
                }
            },
            { root: null, rootMargin: '100px', threshold: 0.1 }
        )

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sentinelRef.current, pageInfo?.nextCursor, pageInfo?.hasNext]);

    useEffect(() => {
        setData([]);
        setPageInfo(null);
        setCursor(null);
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, startDate, endDate]);

    // useEffect(() => {
    //     console.log({ pageInfo, data })
    // }, [pageInfo, data])

    return (
        <div className={cssStyles.pageScroll}>
            <PageHeader
                title="History:"
                chipValue={sensorLabel}
                subtitle={`Historical readings for ${sensorLabel}`}
                actions={
                    <div className={cssStyles.headerActions} data-tour="import-export-actions">
                        <button
                            type="button"
                            onClick={() => setImportOpen(true)}
                            className={cssStyles.exportButton}
                            title="Import data for this sensor"
                        >
                            Import
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenExport}
                            disabled={exportDisabled}
                            className={cssStyles.exportButton}
                            title={exportDisabled ? "Load history data first" : "Export"}
                        >
                            Export
                        </button>
                    </div>
                }
            />

            <Section style={styles.section} data-tour="history-content">
                <div style={styles.header}>
                    {/* meta data */}
                    <div style={styles.metaData} className={cssStyles.historyMetaData} data-tour="history-date-range">
                        <div className={cssStyles.dateRangeInline}>
                            <span className={cssStyles.metaLabel}>From</span>
                            <DateRangeInput
                                value={localStartDate}
                                max={localEndDate}
                                onChange={setLocalStartDate}
                            />
                        </div>
                        <div className={cssStyles.dateRangeInline}>
                            <span className={cssStyles.metaLabel}>To</span>
                            <DateRangeInput
                                value={localEndDate}
                                min={localStartDate}
                                onChange={setLocalEndDate}
                            />
                        </div>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: "#00684A" }}>
                                Sensor Type:&nbsp;
                            </span>
                                {sensorLabel}
                        </Text>
                        <div className={cssStyles.dateRangeInline}>
                            <span className={cssStyles.metaLabel}>Unit:</span>
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className={cssStyles.dateInput}
                                title="Select display unit"
                            >
                                {unitOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                        title={option.disabledReason}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {sensorType === 'damWaterLevel' && (!calibrationStatus.damDepthAvailable || !calibrationStatus.damVolumeAvailable) && (
                                <Text variant="caption" style={{ margin: 0, color: '#6B7280', fontSize: '0.75rem' }}>
                                    {!calibrationStatus.damDepthAvailable && 'm/ft disabled'}
                                    {!calibrationStatus.damDepthAvailable && !calibrationStatus.damVolumeAvailable && ', '}
                                    {!calibrationStatus.damVolumeAvailable && 'MCM disabled'}
                                </Text>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setDateRange(localStartDate, localEndDate)}
                            className={`${cssStyles.setDatesButton}${localStartDate !== startDate || localEndDate !== endDate ? ` ${cssStyles.setDatesButtonDirty}` : ''}`}
                            title={localStartDate !== startDate || localEndDate !== endDate ? "You have unsaved date changes — click to apply" : "Apply current date range"}
                        >
                            Set Dates
                        </button>
                    </div>
                </div>

                {/* 
                    TODO:
                    > add infinite scroll for data
                    > use server side caching for minimal optimization
                    > csv export option should export entire cached data
                */}
                {/* data table */}
                { data && data.length > 0 ? (
                    
                    <div style={styles.table} className={cssStyles.historyTable}>

                        {/* category */}
                        {/* 
                            TODO:
                             > add time and unit conversion option
                        */}
                        <div style={styles.gridContainer} className={cssStyles.historyGridContainer}>
                            <div style={styles.categoryWrapper}>
                                <Text variant="title" style={styles.category}>
                                    Timestamp (UTC)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Value
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Δ (from previous)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Elapsed
                                </Text>
                            </div>
                        </div>

                        {/* data */}
                        {data.map((d:any, idx: number) => {
                            const convertedValue = convertDisplayValue(d.value);
                            const nextValue = idx === data.length - 1 ? null : data[idx + 1].value;
                            const convertedNextValue = nextValue !== null ? convertDisplayValue(nextValue) : null;
                            const delta: number | '-' = convertedNextValue !== null ? convertedValue - convertedNextValue : '-';

                            return (
                            <div key={d._id} style={styles.gridContainer}>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid #001E2B`,
                                    borderLeft: `2px solid #001E2B`,
                                }}>
                                    <Text variant="subtitle">
                                        {new Date(d.recordedAt).toISOString().replace('T', ' ').slice(0,19)}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid #001E2B`,
                                }}>
                                    <Text variant="subtitle">
                                        {convertedValue.toFixed(2)}{selectedUnit}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid #001E2B`,
                                }}>
                                    <Text variant="subtitle">
                                        {delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}${selectedUnit}`}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid #001E2B`,
                                }}>
                                    <Text variant="subtitle">
                                        {timeAgo(d.recordedAt)}
                                    </Text>
                                </div>
                            </div>
                        )})}
                        <div ref={sentinelRef} />
                    </div>
                ) : (
                    // style this
                    <div>
                        <Text variant="title">
                            No data available.
                        </Text>
                    </div>
                )}
            </Section>

            <ExportPreviewModal
                open={exportOpen}
                title={`Export – ${exportTitle}`}
                subtitle={
                    exportBusy
                        ? `${startDate} → ${endDate} · fetching pages: ${exportProgress?.pages ?? 0} · rows: ${exportProgress?.rows ?? 0}`
                        : `${startDate} → ${endDate} · rows: ${exportRows?.length ?? '—'}`
                }
                onClose={() => setExportOpen(false)}
                onDownloadCsv={handleDownloadHistoryCsv}
                onDownloadJson={handleDownloadHistoryJson}
                onDownloadPdf={handleDownloadHistoryPdf}
                busy={exportBusy || exportPngLoading}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', fontFamily: 'Poppins-Light', fontSize: '0.85rem', color: '#023430' }}>
                        <div><strong>Sensor</strong>: {metaData?.sensorType ?? '—'}</div>
                        <div><strong>Unit</strong>: {selectedUnit || '—'}</div>
                        <div><strong>From</strong>: {startDate}</div>
                        <div><strong>To</strong>: {endDate}</div>
                    </div>

                    {exportErr && (
                        <Text variant="caption" style={{ margin: 0, color: '#B91C1C' }}>
                            {exportErr}
                        </Text>
                    )}

                    {exportBusy && (
                        <Text variant="caption" style={{ margin: 0, color: '#6B7280' }}>
                            Preparing export… fetched {exportProgress?.rows ?? 0} rows across {exportProgress?.pages ?? 0} pages.
                        </Text>
                    )}

                    <div style={{ border: '1px solid #E8EDEB', borderRadius: 12, background: '#FFFFFF', padding: '8px 10px' }}>
                        <Text variant="subtitle" style={{ margin: '0 0 6px 0' }}>
                            Overall trend for selected date range
                        </Text>
                        <div ref={exportChartRef} style={{ width: '100%', height: 260 }}>
                            <HistoryTrendChart 
                                rows={exportRows ?? data ?? []} 
                                unit={selectedUnit} 
                                convertValue={convertDisplayValue}
                            />
                        </div>
                    </div>

                    <div style={{ border: '1px solid #E8EDEB', borderRadius: 12, overflow: 'auto', maxHeight: 360 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Poppins-Light', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ background: '#E3FCF7', color: '#023430' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E8EDEB' }}>Timestamp (UTC)</th>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E8EDEB' }}>Value</th>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E8EDEB' }}>Δ (from previous)</th>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E8EDEB' }}>Elapsed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(exportRows ?? data ?? []).slice(0, 25).map((r: any, idx: number, arr: any[]) => {
                                    const convertedValue = typeof r.value === 'number' ? convertDisplayValue(r.value) : r.value;
                                    const nextValue = idx === arr.length - 1 ? null : arr[idx + 1]?.value;
                                    const convertedNextValue = nextValue !== null && typeof nextValue === 'number' ? convertDisplayValue(nextValue) : null;
                                    const delta: number | '-' = convertedNextValue !== null && typeof convertedValue === 'number' 
                                        ? convertedValue - convertedNextValue 
                                        : '-';
                                    const deltaLabel = delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}${selectedUnit}`;
                                    return (
                                    <tr key={r._id}>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {new Date(r.recordedAt).toISOString().replace('T', ' ').slice(0, 19)}
                                        </td>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {typeof convertedValue === 'number' ? convertedValue.toFixed(2) : convertedValue}{selectedUnit}
                                        </td>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {deltaLabel}
                                        </td>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {timeAgo(r.recordedAt)}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    <Text variant="caption" style={{ margin: 0, color: '#6B7280' }}>
                        Preview shows the first 25 rows. Export includes the full date range (auto-fetches all pages).
                    </Text>
                </div>
            </ExportPreviewModal>

            <ImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                sensorType={sensorType}
                sensorLabel={(SENSOR_TYPES as Record<string, { label: string }>)[sensorType]?.label ?? metaData?.sensorType ?? sensorType}
            />
        </div>
    )
}

function HistoryTrendChart({ 
    rows, 
    unit, 
    convertValue 
}: { 
    rows: any[]; 
    unit: string; 
    convertValue?: (value: number) => number;
}) {
    const sorted = [...(rows ?? [])]
        .filter((r) => r?.recordedAt != null && typeof r?.value === 'number')
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const chartData = sorted.map((r) => ({
        tsMs: new Date(r.recordedAt).getTime(),
        timestamp: new Date(r.recordedAt).toISOString(),
        value: convertValue ? convertValue(Number(r.value)) : Number(r.value),
    }));

    if (!chartData.length) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Text variant="caption">No trend data available.</Text>
            </div>
        );
    }

    const pad2 = (v: number) => String(v).padStart(2, '0');
    const formatTick = (ms: number) => {
        const d = new Date(ms);
        return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    };
    const formatTooltipTs = (iso: string) => {
        const d = new Date(iso);
        return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} UTC`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 14, left: 8, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis
                    dataKey="tsMs"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(v) => formatTick(Number(v))}
                    tick={{ fontSize: 11, fill: '#334155' }}
                    stroke="#334155"
                    axisLine={{ stroke: '#CBD5E1' }}
                    minTickGap={24}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: '#334155' }}
                    stroke="#334155"
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickFormatter={(v) => (typeof v === 'number' ? `${v.toFixed(2)}${unit}` : String(v))}
                />
                <Tooltip
                    labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { timestamp?: string } | undefined;
                        return p?.timestamp ? formatTooltipTs(p.timestamp) : '';
                    }}
                    formatter={(value: unknown) =>
                        typeof value === 'number' ? `${value.toFixed(2)}${unit}` : '—'
                    }
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00684A"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    name="Value"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

const styles: {[key: string]: React.CSSProperties} = {
    section: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
    },
    metaData: {
        padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(1rem, 3vw, 2.5rem)',
        display:'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        boxSizing: 'border-box',
    },
    table: {
        padding: '0px clamp(0.5rem, 2vw, 2.5rem)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'visible',
        boxSizing: 'border-box',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
        textAlign: 'center',
        alignItems: 'center',
        minWidth: 'min-content',
        width: '100%',
    },
    category: {
        color: colors.primary,
    },
    categoryWrapper: {
        border: `2px solid #001E2B`,
        width: '100%',
        minWidth: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        wordBreak: 'break-word',
    },
    wrapper: {
        borderBottom: `2px solid #001E2B`,
        width: '100%',
        minWidth: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        wordBreak: 'break-word',
    },
    footer: {
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
    },
    button: {
        padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.25rem, 1vw, 0.3125rem)',
        margin: 0,
    }
}