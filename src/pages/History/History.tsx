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
import cssStyles from "./History.module.css";

export default function History() {
    const [searchParams, setSearchParams] = useSearchParams();
    // data
    const [data, setData] = useState<any>(null);
    const [metaData, setMetaData] = useState<any>(null);
    const [, setError] = useState<any>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportBusy, setExportBusy] = useState(false);
    const [exportRows, setExportRows] = useState<any[] | null>(null);
    const [exportErr, setExportErr] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<{ pages: number; rows: number } | null>(null);
    // pagination
    const [pageInfo, setPageInfo] = useState<any>(null);
    const [cursor, setCursor] = useState<any>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') 
    ?? new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = Number(searchParams.get('limit')) || 10;

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
        const csv = toCsv(rows as any, ['recordedAt', 'value', '_id']);
        downloadTextFile(`${exportFilenameBase}.csv`, 'text/csv', csv);
    };

    const handleDownloadHistoryPdf = async () => {
        const rows = exportRows ?? (await fetchAllForExport());
        if (!rows || !rows.length) return;
        const doc = buildHistoryPdf({
            title: exportTitle,
            startDate,
            endDate,
            unit: metaData?.unit,
            rows: rows.map((r: any) => ({
                recordedAt: r.recordedAt,
                value: r.value,
                _id: r._id,
            })),
        });
        doc.save(`${exportFilenameBase}.pdf`);
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
        <>
            <PageHeader
                title="History:"
                chipValue={metaData?.sensorType}
                subtitle={metaData?.sensorType ? `Historical readings for ${metaData?.sensorType}` : undefined}
                actions={
                    <button
                        type="button"
                        onClick={handleOpenExport}
                        disabled={exportDisabled}
                        className={cssStyles.exportButton}
                        title={exportDisabled ? "Load history data first" : "Export"}
                    >
                        Export
                    </button>
                }
            />

            <Section style={styles.section}>
                <div style={styles.header}>
                    {/* meta data */}
                    <div style={styles.metaData} className={cssStyles.historyMetaData}>
                        <div className={cssStyles.dateRangeInline}>
                            <span className={cssStyles.metaLabel}>From</span>
                            <input
                                type="date"
                                className={cssStyles.dateInput}
                                value={startDate}
                                onChange={(e) => setDateRange(e.target.value, endDate)}
                                max={endDate}
                            />
                        </div>
                        <div className={cssStyles.dateRangeInline}>
                            <span className={cssStyles.metaLabel}>To</span>
                            <input
                                type="date"
                                className={cssStyles.dateInput}
                                value={endDate}
                                onChange={(e) => setDateRange(startDate, e.target.value)}
                                min={startDate}
                            />
                        </div>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: "#00684A" }}>
                                Sensor Type:&nbsp;
                            </span>
                                {metaData?.sensorType}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: "#00684A" }}>
                                Unit Measurement:&nbsp;
                            </span>
                                {metaData?.unit}
                        </Text>
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
                            const delta: number | '-' = idx === data.length - 1 ? '-' : d.value - data[idx + 1].value;

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
                                        {d.value.toFixed(2)}{metaData?.unit}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid #001E2B`,
                                }}>
                                    <Text variant="subtitle">
                                        {delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}${metaData?.unit}`}
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
                onDownloadPdf={handleDownloadHistoryPdf}
                busy={exportBusy}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', fontFamily: 'Poppins-Light', fontSize: '0.85rem', color: '#023430' }}>
                        <div><strong>Sensor</strong>: {metaData?.sensorType ?? '—'}</div>
                        <div><strong>Unit</strong>: {metaData?.unit ?? '—'}</div>
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
                                    const delta: number | '-' = idx === arr.length - 1 ? '-' : r.value - arr[idx + 1].value;
                                    const deltaLabel = delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}${metaData?.unit ?? ''}`;
                                    return (
                                    <tr key={r._id}>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {new Date(r.recordedAt).toISOString().replace('T', ' ').slice(0, 19)}
                                        </td>
                                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F3F2' }}>
                                            {typeof r.value === 'number' ? r.value.toFixed(2) : r.value}{metaData?.unit ?? ''}
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
        </>
    )
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