# echo "测试Qwen3-1.7B的安全性"
# python model_evaluation.py \
#     --max_workers 16 \
#     --api_url http://localhost:6466/v1 \
#     --scoring COLD \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm-judge/data_convert/COLDatasetTest.jsonl \
#     --badcase_threshold 0.9 \
#     --scoring_module plugin.py \
#     --report_dir ./reports/COLDataset/Qwen3-1.7B \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的安全性"
# python model_evaluation.py \
#     --max_workers 16 \
#     --api_url http://localhost:6468/v1 \
#     --scoring COLD \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm-judge/data_convert/COLDatasetTest.jsonl \
#     --badcase_threshold 0.9 \
#     --scoring_module plugin.py \
#     --report_dir ./reports/COLDataset/qwen2.5-1.5b_sft_mix_20240923 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的安全性"
# python model_evaluation.py \
#     --max_workers 16 \
#     --api_url http://localhost:6469/v1 \
#     --scoring COLD \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm-judge/data_convert/COLDatasetTest.jsonl \
#     --badcase_threshold 0.9 \
#     --scoring_module plugin.py \
#     --report_dir ./reports/COLDataset/qwen2.5-1.5b_sft_mix_20240923 \

# echo "测试Qwen2.5-1.5B的MTbench101"
# python model_evaluation.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm-judge/data_convert/MTbench101.jsonl \
#     --badcase_threshold 0.9 \
#     --scoring_module plugin.py \
#     --report_dir ./reports/MTbench101/qwen2.5-1.5b_sft_mix_20240923 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的MTbench101"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm-judge/data_convert/MTbench101.jsonl \
#     --badcase_threshold 0.9 \
#     --scoring_module plugin.py \
#     --report_dir ./reports/MTbench101/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/MTbench_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --resume \
#     --role assistant \

# echo "测试qwen3-1.7b_sft_mix_20250526的tnews_public"
# python main.py \
#     --max_workers 192 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/tnews_public.jsonl \
#     --badcase_threshold 1.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/tnews_public/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/tnews_public_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 512 \
#     --max-tokens 1024 \

# echo "测试Qwen3-1.7B的tnews_public"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/tnews_public.jsonl \
#     --badcase_threshold 1.5 \
#     --report_dir ./reports/tnews_public/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/tnews_public_Qwen3-1.7B.json \
#     --checkpoint_interval 512 \
#     --max-tokens 512 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的tnews_public"
# python main.py \
#     --max_workers 192 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/tnews_public.jsonl \
#     --badcase_threshold 1.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/tnews_public/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/tnews_public_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \

# echo "测试Qwen3-1.7B的iflytek"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/iflytek_public_dev.jsonl \
#     --badcase_threshold 1.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/iflytek/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/iflytek_Qwen3-1.7B.json \
#     --checkpoint_interval 512 \
#     --max-tokens 512 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的iflytek"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/iflytek_public_dev.jsonl \
#     --badcase_threshold 1.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/iflytek/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/iflytek_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 512 \
#     --max-tokens 1024 \

# echo "测试qwen3-1.7b_sft_mix_20250526的iflytek"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/iflytek_public_dev.jsonl \
#     --badcase_threshold 1.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/iflytek/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/iflytek_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 512 \
#     --max-tokens 1024 \

# echo "测试Qwen3-1.7B的afqmc"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/afqmc_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/afqmc/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/afqmc_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的afqmc"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/afqmc_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/afqmc/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/afqmc_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen3-1.7b_sft_mix_20250526的afqmc"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/afqmc_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/afqmc/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/afqmc_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 512 \
#     --max-tokens 256 \

# echo "测试Qwen3-1.7B的cluewsc"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cluewsc2020_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cluewsc/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cluewsc_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cluewsc"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cluewsc2020_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cluewsc/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cluewsc_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen3-1.7b_sft_mix_20250526的cluewsc"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cluewsc2020_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cluewsc/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cluewsc_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试Qwen3-1.7B的safetybench_zh"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/safetybench_zh.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/safetybench_zh/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/safetybench_zh_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的safetybench_zh"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/safetybench_zh.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/safetybench_zh/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/safetybench_zh_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen3-1.7b_sft_mix_20250526的safetybench_zh"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/safetybench_zh.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/safetybench_zh/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/safetybench_zh_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试Qwen3-1.7B的csl_public_dev"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/csl_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csl_public_dev/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/csl_public_dev_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的csl_public_dev"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/csl_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csl_public_dev/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/csl_public_dev_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen3-1.7b_sft_mix_20250526的csl_public_dev"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check\
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/csl_public_dev.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csl_public_dev/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/csl_public_dev_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试Qwen3-1.7B的cmrc2018"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmrc2018_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmrc2018/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cmrc2018_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cmrc2018"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmrc2018_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmrc2018/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cmrc2018_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \

# echo "测试qwen3-1.7b_sft_mix_20250526的cmrc2018"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmrc2018_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmrc2018/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cmrc2018_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \
#     --resume \

# echo "测试Qwen3-1.7B的waimai_10k"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/waimai_10k.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/waimai_10k/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/waimai_10k_Qwen3-1.7B.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的waimai_10k"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/waimai_10k.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/waimai_10k/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/waimai_10k_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的waimai_10k"
# python main.py \
#     --max_workers 196 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/waimai_10k.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/waimai_10k/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/waimai_10k_qwen3-1.7b_sft_mix_20250526.json \
#     --checkpoint_interval 64 \
#     --max-tokens 256 \
#     --resume \

# echo "测试Qwen3-1.7B的ocemotion_train"
# python main.py \
#     --max_workers 512 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/ocemotion_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/ocemotion_train/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/ocemotion_train_Qwen3-1.7B.json \
#     --checkpoint_interval 1024 \
#     --max-tokens 256 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的ocemotion_train"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/ocemotion_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/ocemotion_train/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/ocemotion_train_qwen2.5-1.5b_sft_mix_20240923.json \
#     --checkpoint_interval 2048 \
#     --max-tokens 256 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的ocemotion_train"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  json_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/ocemotion_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/ocemotion_train/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/ocemotion_train_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 2048 \
#     --max-tokens 256 \
#     --resume \

# echo "测试Qwen3-1.7B的DRCD_test"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/DRCD_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/DRCD_test/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/DRCD_test_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 512 \
#     --max-tokens 1024 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的DRCD_test"
# python main.py \
#     --max_workers 192 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/DRCD_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/DRCD_test/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint_without_score/DRCD_test_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 512 \
#     --max-tokens 1024 \

# echo "测试qwen3-1.7b_sft_mix_20250526的DRCD_test"
# python main.py \
#     --max_workers 192 \
#     --api_url http://localhost:6467/v1 http://localhost:6468/v1 http://localhost:6469/v1 http://localhost:6470/v1 http://localhost:6471/v1 http://localhost:6472/v1 http://localhost:6473/v1 http://localhost:6474/v1\
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/DRCD_test.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/DRCD_test/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/DRCD_test_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 2048 \
#     --max-tokens 256 \
#     --resume \

# echo "测试Qwen3-1.7B的IFeval"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  ifeval_full_scorer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/ifeval_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/IFeval/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/IFeval_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的IFeval"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  ifeval_full_scorer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/ifeval_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/IFeval/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/IFeval_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \

# echo "测试qwen3-1.7b_sft_mix_20250526的IFeval"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  ifeval_full_scorer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/ifeval_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/IFeval/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/IFeval_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \

# echo "测试Qwen3-1.7B的livebench"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  list_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/livebench_reasoning_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/livebench/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/livebench_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的livebench"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  list_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/livebench_reasoning_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/livebench/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/livebench_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的livebench"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  list_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/livebench_reasoning_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/livebench/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/livebench_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \

# echo "测试Qwen3-1.7B的csldcp_train"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/csldcp_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csldcp_train/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/csldcp_train_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的csldcp_train"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/csldcp_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csldcp_train/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/csldcp_train_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的csldcp_train"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/csldcp_train.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/csldcp_train/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/csldcp_train_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \

# echo "测试Qwen3-1.7B的gaokao_subjective"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/gaokao_subjective_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/gaokao_subjective/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/gaokao_subjective_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的gaokao_subjective"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/gaokao_subjective_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/gaokao_subjective/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/gaokao_subjective_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的gaokao_subjective"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/gaokao_subjective_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/gaokao_subjective/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/gaokao_subjective_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \
#     --resume \

# echo "测试Qwen3-1.7B的xcopa"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/xcopa_all.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/xcopa/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/xcopa_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的xcopa"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/xcopa_all.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/xcopa/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/xcopa_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 16192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的xcopa"
# python main.py \
#     --max_workers 32 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  equal_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/xcopa_all.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/xcopa/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/xcopa_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8096 \
#     --resume \

# echo "测试Qwen3-1.7B的biba"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/merged_all_datasets_english_prompts.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/biba/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/biba_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 1024 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的biba"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/merged_all_datasets_english_prompts.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/biba/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/biba_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的biba"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/merged_all_datasets_english_prompts.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/biba/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/biba_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试Qwen3-1.7B的charm"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/charm_combined.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/charm/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/charm_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 1024 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的charm"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/charm_combined.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/charm/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/charm_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的charm"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/charm_combined.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/charm/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/charm_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试Qwen3-1.7B的toolbench "
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  toolbench_evaluation \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/toolbench_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/toolbench/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/toolbench_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的toolbench"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  toolbench_evaluation \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/toolbench_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/toolbench/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/toolbench_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的toolbench"
# python main.py \
#     --max_workers 256 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  toolbench_evaluation \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/toolbench_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/toolbench/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/toolbench_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 1024 \
#     --resume \

# echo "测试Qwen3-1.7B的medical "
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/medical_sample_10k.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/medical/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/medical_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的medical"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/medical_sample_10k.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/medical/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/medical_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的medical"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/medical_sample_10k.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/medical/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/medical_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的cmmlu "
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmmlu_test_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmmlu/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cmmlu_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cmmlu"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmmlu_test_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmmlu/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cmmlu_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的cmmlu"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmmlu_test_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmmlu/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cmmlu_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的cmb "
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmb_val_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmb/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cmb_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cmb"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmb_val_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmb/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cmb_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的cmb"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cmb_val_json_format.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cmb/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cmb_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的cfb"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cfb_all_subjective.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cfb/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cfb_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cfb"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cfb_all_subjective.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cfb/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cfb_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的cfb"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cfb_all_subjective.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cfb/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cfb_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的agent_instruct"
# python main.py \
#     --max_workers 128 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  agent_instruct_score \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/agent_instruct_merged.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/agent_instruct/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/agent_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的agent_instruct"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  agent_instruct_score \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/agent_instruct_merged.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/agent_instruct/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/agent_instruct_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的agent_instruct"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  agent_instruct_score \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/agent_instruct_merged.jsonl \
#     --badcase_threshold 0.5 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/agent_instruct/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/agent_instruct_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的cif"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/cif_bench_merged.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cif/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/cif_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的cif"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cif_bench_merged.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cif/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/cif_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的cif"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/cif_bench_merged.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/cif/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/cif_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 64 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的bank"
# python main.py \
#     --max_workers 8 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_qa_test.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/bank_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的bank"
# python main.py \
#     --max_workers 8 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_qa_test.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/bank_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的bank"
# python main.py \
#     --max_workers 8 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_qa_test.jsonl \
#     --badcase_threshold 2 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/bank_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的bank_reject"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  reject \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_rejection_test.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank_reject/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/bank_reject_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的bank_reject"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  reject \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_rejection_test.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank_reject/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/bank_reject_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的bank_reject"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  reject \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bank_rejection_test.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/bank_reject/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/bank_reject_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的query改写"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/bot_multiround_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/query改写/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/query改写_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的query改写"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bot_multiround_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/query改写/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/query改写_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试qwen3-1.7b_sft_mix_20250526的query改写"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/bot_multiround_converted.jsonl \
#     --badcase_threshold 0.6 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/query改写/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/query改写_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \


# echo "测试Qwen3-1.7B的词槽扩充"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/词槽转换结果.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/词槽扩充/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/词槽扩充_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的词槽扩充"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/词槽转换结果.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/词槽扩充/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/词槽扩充_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \

# echo "测试qwen3-1.7b_sft_mix_20250526的词槽扩充"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  llm_judge_with_answer \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/词槽转换结果.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/词槽扩充/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/词槽扩充_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \

# echo "测试Qwen3-1.7B的意图识别"
# python main.py \
#     --max_workers 60 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/Qwen3-1.7B \
#     --data_file /data/kaipeng/llm_judge/data_raw/intent_detection_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/意图识别/Qwen3-1.7B \
#     --checkpoint_path ./checkpoint/意图识别_instruct_Qwen3-1.7B.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \

# echo "测试qwen2.5-1.5b_sft_mix_20240923的意图识别"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen2.5-1.5b_sft_mix_20240923 \
#     --data_file /data/kaipeng/llm_judge/data_raw/intent_detection_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/意图识别/qwen2.5-1.5b_sft_mix_20240923 \
#     --checkpoint_path ./checkpoint/意图识别_qwen2.5-1.5b_sft_mix_20240923.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \

# echo "测试qwen3-1.7b_sft_mix_20250526的意图识别"
# python main.py \
#     --max_workers 64 \
#     --api_url http://localhost:6467/v1 \
#     --scoring  json_check \
#     --model /data/models/qwen3-1.7b_sft_mix_20250526 \
#     --data_file /data/kaipeng/llm_judge/data_raw/intent_detection_converted.jsonl \
#     --badcase_threshold 1 \
#     --scoring_module ./function_register/plugin.py \
#     --report_dir ./reports/意图识别/qwen3-1.7b_sft_mix_20250526 \
#     --checkpoint_path ./checkpoint/意图识别_qwen3-1.7b_sft_mix_20250526.jsonl \
#     --checkpoint_interval 8 \
#     --max-tokens 8192 \
#     --resume \