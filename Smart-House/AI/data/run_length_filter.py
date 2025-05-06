#!/usr/bin/env python
# -*- coding: utf‑8 -*-
"""
Run‑length deduplication:
giữ 1 bản ghi đầu tiên cho mỗi chuỗi >= min_run giá trị liên tiếp giống nhau
(áp dụng độc lập trên từng sensor_id).
"""

import pandas as pd
import numpy as np

def collapse_runs(
    df: pd.DataFrame,
    min_run: int = 3,
    id_col: str = "sensor_id",
    value_col: str = "value",
    ts_col: str = "timestamp",
    tol: float = 1e-9,
) -> pd.DataFrame:
    if df.empty:
        return df

    # Sắp xếp trong từng id theo timestamp
    df = df.sort_values([id_col, ts_col]).reset_index(drop=True)

    keep = pd.Series(False, index=df.index)

    for _, group in df.groupby(id_col):
        idx = group.index
        # phát hiện điểm Giá trị đổi (với tol)
        changed = (group[value_col].diff().abs() > tol).fillna(True)
        run_id = changed.cumsum()

        # tính chiều dài từng run
        run_len = group.groupby(run_id)[value_col].transform("size")

        # Giữ lại:
        #  ‑ mọi bản ghi nếu run_len < min_run
        #  ‑ chỉ bản ghi đầu (changed==True) nếu run_len >= min_run
        keep_group = (run_len < min_run) | changed
        keep.loc[idx] = keep_group

    return df.loc[keep].copy()