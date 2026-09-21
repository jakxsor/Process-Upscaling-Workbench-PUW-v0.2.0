"""Regression checks for PubChem property normalization used by LUTZE screening."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from upscaling_pipeline_tool.pubchem_lookup import (
    map_pubchem_fields,
    pubchem_measurement_temperature,
    pubchem_numeric_property,
)


assert pubchem_numeric_property("1.5 mmHg at 25 °C", "pvap") == "200"
assert pubchem_numeric_property("1.5 x 10^-3 mm Hg at 25 °C", "pvap") == "0.2"
assert pubchem_numeric_property("25 °C: 1.5 kPa", "pvap") == "1.5e+03"
assert pubchem_numeric_property("0.2 bar at 298 K", "pvap") == "2e+04"
assert pubchem_numeric_property("12 pressure units not stated", "pvap") == ""
assert pubchem_measurement_temperature("1.5 kPa at 25 °C") == "298.15"
assert pubchem_measurement_temperature("1.5 kPa at 77 F") == "298.15"
assert pubchem_measurement_temperature("1.5 kPa") == ""

mapped = map_pubchem_fields(
    {"MolecularWeight": 100.2},
    {"vapor_pressure": ["25 °C: 1.5 kPa"], "boiling_point": ["100 °C"]},
)
assert mapped["mw"] == "100.2"
assert mapped["pvap"] == "1.5e+03"
assert mapped["pvapTemperature"] == "298.15"
assert mapped["pvapRaw"] == "25 °C: 1.5 kPa"

print("PubChem property normalization regression check passed.")
