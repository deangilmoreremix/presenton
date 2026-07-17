import json
from pathlib import Path

from constants.presentation import DEFAULT_TEMPLATES


def test_default_templates_match_supported_builtin_groups():
    assert DEFAULT_TEMPLATES == [
        "general",
        "modern",
        "standard",
        "swift",
        "dynamic",
    ]


def test_openapi_exposes_template_v2_catalog_and_schema_detail():
    openapi_spec_path = Path(__file__).resolve().parents[2] / "openai_spec.json"
    spec = json.loads(openapi_spec_path.read_text(encoding="utf-8"))

    list_operation = spec["paths"]["/api/v1/ppt/templates"]["get"]
    detail_operation = spec["paths"]["/api/v1/ppt/templates/{template_id}"]["get"]

    assert list_operation["operationId"] == "templates_list"
    assert detail_operation["operationId"] == "templates_get"

    list_item = spec["components"]["schemas"]["TemplateV2ListItem"]
    detail = spec["components"]["schemas"]["TemplateV2Response"]
    assert "generation_template" in list_item["properties"]
    assert "layout_schema" in detail["properties"]
    assert "layouts" in detail["properties"]
