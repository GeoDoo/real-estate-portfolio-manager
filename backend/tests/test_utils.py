import pytest
from app import clean_for_json

def test_clean_for_json_basic():
    assert clean_for_json(float("nan")) is None
    assert clean_for_json(float("inf")) is None
    assert clean_for_json(float("-inf")) is None
    assert clean_for_json(42.0) == 42.0
    assert clean_for_json("foo") == "foo"

def test_clean_for_json_list():
    data = [1, float("nan"), 2, float("inf"), 3]
    assert clean_for_json(data) == [1, None, 2, None, 3]

def test_clean_for_json_dict():
    data = {"a": 1, "b": float("nan"), "c": float("inf"), "d": 2}
    assert clean_for_json(data) == {"a": 1, "b": None, "c": None, "d": 2}

def test_clean_for_json_nested():
    data = {"a": [1, float("nan"), {"b": float("inf"), "c": [float("-inf"), 2]}]}
    assert clean_for_json(data) == {"a": [1, None, {"b": None, "c": [None, 2]}]} 